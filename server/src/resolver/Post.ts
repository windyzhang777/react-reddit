import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Post } from "../entity/Post";
import { isAuth } from "../middleware/isAuth";
import { ContextType } from "../types";
import { PostInput } from "./PostInput";
import { PostResponse } from "./PostResponse";
// import { sleep } from "../utils/sleep";

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: ContextType
  ) {
    const { userId } = req.session;
    const point = value !== -1 ? 1 : -1;
    // await Updoot.insert({
    //   userId,
    //   postId,
    //   value: point,
    // });
    const posts = await getConnection().query(
      `
      START TRANSACTION;

      INSERT INTO "updoot" ("value", "userId", "postId")
      VALUES (${point}, ${userId}, ${postId});
      
      update post
      set points = points + ${point}
      where id = ${postId};
      
      COMMIT;
    `
    );
    console.log(`------- posts :`, posts);
    return true;
  }

  @Query(() => PostResponse)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true })
    cursor: string | null
  ): Promise<PostResponse> {
    // await sleep(3000);
    // return Post.find();
    const limitMax = Math.min(50, limit) + 1;
    const replacements: any[] = [limitMax];
    if (cursor) {
      replacements.push(new Date(cursor));
    }
    const posts = await getConnection().query(
      `
        select p.*,
          json_build_object(
            'id', u.id,
            'username', u.username,
            'email', u.email,
            'createdAt', u."createdAt",
            'updatedAt', u."updatedAt"
          ) author
        from post p
        inner join public.user u on u.id = p."authorId"
        ${cursor ? `where p."createdAt" < $2` : ""}
        order by p."createdAt" DESC
        limit $1
      `,
      replacements
    );
    // console.log(`------- posts :`, posts);
    // const qb = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder("p")
    //   .innerJoinAndSelect("p.author", "a", 'a.id = p."authorId"')
    //   .orderBy('p."createdAt"', "DESC")
    //   .take(limitMax); // Sets maximal number of entities to take
    // if (cursor) {
    //   qb.where('p."createdAt" < :cursor', { cursor: new Date(cursor) });
    // }
    // const posts = await qb.getMany();
    return {
      posts: posts.slice(0, limitMax - 1),
      hasMore: posts.length === limitMax,
    };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("postId") id: number): Promise<Post | undefined> {
    // return Post.findOne(id);
    return Post.findOne({ where: { id } });
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(@Arg("input") input: PostInput, @Ctx() { req }: ContextType): Promise<Post> {
    return Post.create({
      ...input,
      authorId: req.session.userId,
    }).save();
    // // sql/query builder
    // let post;
    // const res = await getConnection()
    //   .createQueryBuilder()
    //   .insert()
    //   .into(Post)
    //   .values({
    //     title: title,
    //   })
    //   .returning("*")
    //   .execute();
    // post = res.raw[0];
    // return post;
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("postId") id: number,
    @Arg("title", () => String, { nullable: true })
    title: string | null
  ): Promise<Post | undefined> {
    const found = await Post.findOne(id);
    if (!found) return undefined;
    if (!!title) {
      await Post.update({ id }, { title });
    }
    return found;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("postId") id: number): Promise<boolean> {
    // try {
    await Post.delete(id);
    // } catch {
    //   return false;
    // }
    return true;
  }
}
