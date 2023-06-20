import {
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from "@chakra-ui/core";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import { useState } from "react";
import Layout from "src/components/Layout";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 5,
    cursor: null as null | string,
  });
  const [{ data, fetching }] = usePostsQuery({
    variables,
  });
  // console.log(`------- variables :`, variables);

  let content = null;
  switch (true) {
    case !data && fetching:
      content = <div>loading..</div>;
      break;
    case !data && !fetching:
      content = <div>query failed</div>;
      break;
    case !!data:
      content = (
        <Stack spacing={8}>
          {data?.posts?.posts?.map((p) => (
            <Box
              p={5}
              shadow="md"
              borderWidth="1px"
              key={p.id}
            >
              <Heading fontSize="xl">{p.title}</Heading>
              <Text mt={4}>{p.textSnippet}</Text>
            </Box>
          ))}
        </Stack>
      );
      break;
    default:
      content = <div>no post yet</div>;
      break;
  }

  return (
    <Layout>
      <Flex align="center">
        <Heading>Posts</Heading>
        <NextLink href="/create-post">
          <Link ml="auto">create post</Link>
        </NextLink>
      </Flex>
      <br />
      {content}
      {!!data && data.posts.hasMore && (
        <Flex>
          <Button
            isLoading={fetching}
            m="auto"
            my={8}
            onClick={() =>
              setVariables((prev) => {
                return {
                  limit: prev.limit,
                  cursor:
                    data.posts.posts.slice(-1)[0].createdAt,
                };
              })
            }
          >
            load more
          </Button>
        </Flex>
      )}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, {
  ssr: true,
})(Index);
