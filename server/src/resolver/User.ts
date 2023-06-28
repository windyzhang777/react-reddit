import argon2 from "argon2";
import { Arg, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from "type-graphql";
import { getConnection } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../constants";
import { User } from "../entity/User";
import { ContextType } from "../types";
import { sendEmail } from "../utils/sendEmail";
import { validateRegister } from "../utils/validateRegister";
import { UserResponse } from "./UserResponse";
import { UsernamePasswordInput } from "./UsernamePasswordInput";

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() root: User, @Ctx() { req }: ContextType) {
    if (req.session.userId === root.id) {
      return root.email;
    }
    return "";
  }

  @Query(() => [User])
  users(): Promise<User[]> {
    return User.find();
  }

  @Mutation(() => Boolean)
  async deleteUser(@Arg("userId") id: number): Promise<boolean> {
    // try {
    await User.delete(id);
    // } catch {
    //   return false;
    // }
    return true;
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: ContextType): undefined | Promise<User | undefined> {
    // console.log(`------- req.session :`, req.session);
    if (!req.session.userId) {
      return undefined;
    }
    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("credentials", () => UsernamePasswordInput)
    credentials: UsernamePasswordInput,
    @Ctx() { req }: ContextType
  ): Promise<UserResponse> {
    const errors = validateRegister(credentials);
    if (errors) return { errors };
    const hashedPassword = await argon2.hash(credentials.password);
    let user;
    try {
      // user = await User.create({
      //   username: credentials.username,
      //   email: credentials.email,
      //   password: hashedPassword,
      // }).save();
      const result = await getConnection()
        .createQueryBuilder()
        .insert() // insert/update/delete
        .into(User)
        .values({
          username: credentials.username,
          email: credentials.email,
          password: hashedPassword,
        })
        .returning("*") // return back to fields
        .execute();
      user = result.raw[0];
    } catch (err) {
      if (err.code === "23505" || err.detail.include("already exists")) {
        return {
          errors: [
            {
              field: "email",
              message: "email already taken",
            },
          ],
        };
      }
    }
    req.session.userId = user?.id;
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: ContextType
  ): Promise<UserResponse> {
    const found = await User.findOne({
      where: usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail },
    });
    if (!found) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "username or email does not exist",
          },
        ],
      };
    }
    const valid = await argon2.verify(found.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ],
      };
    }
    req.session.userId = found.id;
    return { user: found };
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: ContextType): Promise<boolean> {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(`------- logout error :`, err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: ContextType
  ): Promise<boolean> {
    const found = await User.findOne({ where: { email } });
    if (!found) {
      return true;
    }
    const token = uuidv4();
    await redis.set(
      FORGOT_PASSWORD_PREFIX + token, // key
      found.id, // value
      "ex", // expiryMode - expire after some amount of time
      1000 * 60 * 60 * 24 * 3 // millisecond, 3 days
    );
    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );
    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: ContextType
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "password too short (>2)",
          },
        ],
      };
    }
    const key = FORGOT_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      return { errors: [{ field: "token", message: "token invalid" }] };
    }
    const found = await User.findOne(parseInt(userId));
    if (!found) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exist",
          },
        ],
      };
    }
    await User.update(
      { id: parseInt(userId) },
      {
        password: await argon2.hash(newPassword),
      }
    );
    // found.password = await argon2.hash(newPassword);
    // await User.save(found);

    // remove redis key so can't reuse the same token
    await redis.del(key);

    // optional: login user after change password
    req.session.userId = found.id;
    return { user: found };
  }
}
