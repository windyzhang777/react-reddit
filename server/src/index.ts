import { ApolloServer } from "apollo-server-express";
import ConnectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import Redis from "ioredis"; // ~/redis-6.0.10/src/redis-server
import path from "path";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { COOKIE_NAME, __prod__ } from "./constants";
import { ContextType } from "./types";
import { Post } from "./entity/Post";
// import { sendEmail } from "./utils/sendEmail";

const config = {
  database: "lireddit",
  entities: [__dirname + "/entity/*.js"],
  host: "localhost",
  logging: true,
  migrations: [path.join(__dirname, "/migration/*")],
  username: "",
  password: "",
  synchronize: true, // auto create table no need to run migration
  type: "postgres",
} as Parameters<typeof createConnection>[0];

const main = async () => {
  // sendEmail("bob@bob.com", "hello there");
  const connection = await createConnection(config);
  // await connection.runMigrations();
  // await Post.delete({});

  const app = express();
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  // Initialize client & store
  const redisClient = new Redis();
  const redisStore = ConnectRedis(session);
  // Initialize sesssion storage
  app.use(
    session({
      // express-session
      name: COOKIE_NAME, // session ID cookie name set in the response (read from reqest); default is 'connect.sid'
      store: new redisStore({ client: redisClient }), // tell express-session using redis
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365, // expire datetime; no maximum age by default
        httpOnly: true, // for security reason; not allow client-side/FE JavaScript to access the cookie in document.cookie
        sameSite: "lax",
        secure: __prod__, // best to be false on dev; if set to true, cookie only works in HTTPS; localhost not using HTTPS; only set to true if prod uses HTTPS
      },
      resave: false, // required: force lightweight session keep alive (touch)
      saveUninitialized: false, // recommended: only save session when data exists
      secret: "keyboard cat", // used to sign/encrypt the session cookie (best be a RANDOM set of characters, and be HIDEN in a ENV variable)
    })
  );

  const server = new ApolloServer({
    schema: await buildSchema({
      resolvers: [__dirname + "/resolver/*.js"],
      validate: false,
    }),
    context: ({ req, res }): ContextType => ({ req, res, redis: redisClient }),
  });

  server.applyMiddleware({ app, cors: false });

  app.listen(4000, () => {
    console.log(`server on localhost:4000`);
  });
};

main().catch((error) => console.log(error));
