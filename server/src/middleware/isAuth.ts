import { ContextType } from "src/types";
import { MiddlewareFn } from "type-graphql";

export const isAuth: MiddlewareFn<ContextType> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error("not authenticated");
  }

  return next();
};
