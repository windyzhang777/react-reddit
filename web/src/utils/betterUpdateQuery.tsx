import {
  Cache,
  QueryInput,
} from "@urql/exchange-graphcache";

export function betterUpdateQuery<Mutation, Query>(
  cache: Cache,
  queryInput: QueryInput,
  result: any,
  updater: (r: Mutation, q: Query) => Query
) {
  return cache.updateQuery(
    queryInput,
    (data) => updater(result, data as any) as any
  );
}
