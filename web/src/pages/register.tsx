import { Box, Button } from "@chakra-ui/core";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import { FC } from "react";
import InputField from "src/components/InputField";
import Wrapper from "src/components/Wrapper";
import { useRegisterMutation } from "src/generated/graphql";
import { createUrqlClient } from "src/utils/createUrqlClient";
import { toErrorMap } from "src/utils/toErrorMap";

interface RegisterProps {}

const Register: FC<RegisterProps> = ({}) => {
  const router = useRouter();
  const [, register] = useRegisterMutation();

  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{
          username: "",
          email: "",
          password: "",
        }}
        onSubmit={async (values, { setErrors }) => {
          const response = await register({
            credentials: values,
          });
          if (response.data?.register.errors) {
            // console.log(response.data?.register.errors);
            // handle errors
            setErrors(
              toErrorMap(response.data?.register.errors)
            );
          } else if (response.data?.register.user) {
            router.push("/");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              label={"username"}
              name={"username"}
              placeholder={"username"}
            />
            <Box mt={4} />
            <InputField
              label={"email"}
              name={"email"}
              placeholder={"email"}
              type={"email"}
            />
            <Box mt={4} />
            <InputField
              label={"password"}
              name={"password"}
              placeholder={"password"}
              type={"password"}
            />
            <Box mt={4} />
            <Button
              isLoading={isSubmitting}
              type="submit"
              variantColor="teal"
            >
              register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Register);
