import { Box, Button } from "@chakra-ui/core";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import { FC } from "react";
import InputField from "src/components/InputField";
import Layout from "src/components/Layout";
import { useCreatePostMutation } from "src/generated/graphql";
import { createUrqlClient } from "src/utils/createUrqlClient";
import { useIsAuth } from "src/utils/useIsAuth";

interface CreatePostProps {}

const CreatePost: FC<CreatePostProps> = ({}) => {
  const [, createPost] = useCreatePostMutation();
  const router = useRouter();
  useIsAuth();

  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: "", text: "" }}
        onSubmit={async (values) => {
          const { error, data } = await createPost({
            input: values,
          });
          // console.log(`------- error :`, JSON.stringify(error, null, 2));
          // if ( error?.message.includes("not authenticated")) {
          //   router.push("/login");
          // } else {
          //   router.push("/");
          // }
          if (!error) {
            router.push("/");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              label="title"
              name="title"
              placeholder="title"
            />
            <Box mt={4} />
            <InputField
              label="text"
              name="text"
              placeholder="text"
              textarea
            />
            <Button
              isDisabled={isSubmitting}
              mt={4}
              type="submit"
              variantColor="teal"
            >
              create post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(CreatePost);
