import { Field, ObjectType } from "type-graphql";
import { Post } from "../entity/Post";

@ObjectType()
export class PostResponse {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}
