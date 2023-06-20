import { dedupExchange, fetchExchange } from "@urql/core";
import {
  Resolver,
  cacheExchange,
} from "@urql/exchange-graphcache";
import Router from "next/router";
import {
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
} from "src/generated/graphql";
import { Exchange, stringifyVariables } from "urql";
import { pipe, tap } from "wonka";
import { betterUpdateQuery } from "./betterUpdateQuery";

export const errorExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    return pipe(
      forward(ops$),
      tap(({ error }) => {
        if (error) {
          if (
            error?.message.includes("not authenticated")
          ) {
            Router.replace("/login");
          }
        }
      })
    );
  };

const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;
    // console.log(`entityKey fieldName :`, entityKey, fieldName); // Query posts
    const allFields = cache.inspectFields(entityKey);
    console.log(`allFields :`, allFields);
    const fieldInfos = allFields.filter(
      (info) => info.fieldName === fieldName
    );
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }
    // console.log(`fieldArgs :`, fieldArgs);
    // console.log(`fieldKey :`, `${fieldName}(${stringifyVariables(fieldArgs)})`);
    const cacheEntity = cache.resolve(
      entityKey,
      `${fieldName}(${stringifyVariables(fieldArgs)})`
    ) as string;
    // console.log(`cacheEntity :`, cacheEntity); // Query.posts({"limit":5})
    const isInCache = cache.resolve(cacheEntity, "posts");
    // console.log(`isInCache :`, isInCache);
    info.partial = !isInCache;
    const results: string[] = [];
    let posts = null;
    let hasMore = true;
    for (const fieldInfo of fieldInfos) {
      const postEntity = cache.resolve(
        entityKey,
        fieldInfo.fieldKey
      ) as string;
      // console.log(`postEntity :`, postEntity); // Query.posts({"limit":5})
      posts = cache.resolve(
        postEntity,
        "posts"
      ) as string[];
      hasMore = cache.resolve(
        postEntity,
        "hasMore"
      ) as boolean;
      // console.log(`hasMore posts :`, hasMore, posts); // [ 'Post:17', 'Post:18', ..]
      results.push(...posts);
    }
    // console.log(`results :`, results);
    return { __typename: "PostResponse", hasMore, posts };
  };
};

export const createUrqlClient = (ssrExchange: any) => ({
  url: "http://localhost:4000/graphql",
  fetchOptions: {
    credentials: "include" as const,
  },
  exchanges: [
    dedupExchange,
    cacheExchange({
      keys: {
        PostResponse: () => null,
      },
      resolvers: {
        Query: {
          posts: cursorPagination(),
        },
      },
      updates: {
        Mutation: {
          login: (_result, args, cache, info) => {
            betterUpdateQuery<LoginMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.login.errors) {
                  // return current user if errors
                  return query;
                } else {
                  // or return the new logged in user
                  return {
                    me: result.login.user,
                  };
                }
              }
            );
          },
          register: (_result, args, cache, info) => {
            betterUpdateQuery<RegisterMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.register.errors) {
                  return query;
                } else {
                  return {
                    me: result.register.user,
                  };
                }
              }
            );
          },
          logout: (_result, args, cache, info) => {
            betterUpdateQuery<LogoutMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              () => ({ me: null })
            );
          },
        },
      },
    }),
    errorExchange,
    ssrExchange,
    fetchExchange,
  ],
});
