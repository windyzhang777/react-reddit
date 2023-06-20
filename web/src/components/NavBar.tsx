import { Box, Button, Flex, Link } from "@chakra-ui/core";
import NextLink from "next/link";
import { FC } from "react";
import {
  useLogoutMutation,
  useMeQuery,
} from "src/generated/graphql";
import { isServer } from "src/utils/isServer";

interface NavBarProps {}

const NavBar: FC<NavBarProps> = ({}) => {
  const [{ data, fetching }] = useMeQuery({
    pause: isServer(),
  });
  // console.log(`me :`, data);
  const [{ fetching: loggingOut }, logout] =
    useLogoutMutation();

  let content = null;
  switch (true) {
    // fetching
    case fetching === true:
      content = null;
      break;
    case !data?.me:
      // not logged in
      content = (
        <>
          <NextLink href={"/login"}>
            <Link mr={2}>Login</Link>
          </NextLink>
          <NextLink href={"/register"}>
            <Link>Register</Link>
          </NextLink>
        </>
      );
      break;
    case !!data?.me:
      // logged in
      content = (
        <Flex>
          <Box mr={2}>{data?.me?.username}</Box>
          <Button
            isLoading={loggingOut}
            onClick={() => logout()}
            variant="link"
          >
            Logout
          </Button>
        </Flex>
      );
      break;
    default:
      content = null;
      break;
  }
  return (
    <Flex
      bg={"tan"}
      p={4}
      position={"sticky"}
      top={0}
      zIndex={2}
    >
      <Box ml={"auto"}>{content}</Box>
    </Flex>
  );
};

export default NavBar;
