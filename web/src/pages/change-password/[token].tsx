import { Button, Flex, Link, Text } from "@chakra-ui/core";
import { Form, Formik } from "formik";
import { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import InputField from "src/components/InputField";
import Wrapper from "src/components/Wrapper";
import { useChangePasswordMutation } from "src/generated/graphql";
import { createUrqlClient } from "src/utils/createUrqlClient";
import { toErrorMap } from "src/utils/toErrorMap";

const ChangePassword: NextPage<{
  token: string;
}> = () => {
  const router = useRouter();
  const [, ChangePassword] = useChangePasswordMutation();
  const [tokenError, setTokenError] = useState("");
  // console.log(`------- router :`, router);

  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ newPassword: "" }}
        onSubmit={async (values, { setErrors }) => {
          const response = await ChangePassword({
            token: router?.query?.token as string,
            newPassword: values.newPassword,
          });
          if (response.data?.changePassword.errors) {
            const errorMap = toErrorMap(
              response.data.changePassword.errors
            );
            if ("token" in errorMap) {
              setTokenError(errorMap.token);
            }
            setErrors(errorMap);
          } else if (response.data?.changePassword.user) {
            router.push("/");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              label={"new password"}
              name={"newPassword"}
              placeholder={"new password"}
              type="password"
            />
            {tokenError && (
              <Flex>
                <Text mr={2} color={"tomato"}>
                  {tokenError}
                </Text>
                <NextLink href="/forgot-password">
                  <Link>forgot password</Link>
                </NextLink>
              </Flex>
            )}
            <Button
              mt={4}
              isLoading={isSubmitting}
              type="submit"
              variantColor="teal"
            >
              Reset Password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

// ChangePassword.getInitialProps = ({ query }) => {
//   return { token: query.token as string };
// };

export default withUrqlClient(createUrqlClient, {
  ssr: false,
})(ChangePassword);
