import { Box, Button, Flex, Link } from "@chakra-ui/core";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { FC } from "react";
import InputField from "src/components/InputField";
import Wrapper from "src/components/Wrapper";
import { useLoginMutation } from "src/generated/graphql";
import { createUrqlClient } from "src/utils/createUrqlClient";
import { toErrorMap } from "src/utils/toErrorMap";

interface LoginProps {}

const Login: FC<LoginProps> = ({}) => {
  const router = useRouter();
  const [, login] = useLoginMutation();
  // console.log(`------- router :`, router);

  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{
          usernameOrEmail: "",
          password: "",
        }}
        onSubmit={async (values, { setErrors }) => {
          const response = await login(values);
          if (response.data?.login.errors) {
            setErrors(
              toErrorMap(response.data?.login.errors)
            );
          } else if (response.data?.login.user) {
            router.push(
              (router?.query?.next as string) || "/"
            );
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              label="username or email"
              name="usernameOrEmail"
              placeholder="username or email"
            />
            <Box mt={4} />
            <InputField
              label="password"
              name="password"
              placeholder="password"
              type={"password"}
            />
            <Box mt={4} />
            <Flex>
              <NextLink href="/forgot-password">
                <Link ml="auto" color={"darkgray"}>
                  forgot password
                </Link>
              </NextLink>
            </Flex>
            <Box mt={4} />
            <Button
              isLoading={isSubmitting}
              type="submit"
              variantColor="teal"
            >
              Login
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Login);
