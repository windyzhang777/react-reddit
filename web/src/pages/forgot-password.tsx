import { Box, Button } from "@chakra-ui/core";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { FC, useState } from "react";
import InputField from "src/components/InputField";
import Wrapper from "src/components/Wrapper";
import { useForgotPasswordMutation } from "src/generated/graphql";
import { createUrqlClient } from "src/utils/createUrqlClient";

interface ForgotPasswordProps {}

const ForgotPassword: FC<ForgotPasswordProps> = ({}) => {
  const [, forgotPassword] = useForgotPasswordMutation();
  const [complete, setComplete] = useState(false);

  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ email: "" }}
        onSubmit={async (values) => {
          await forgotPassword(values);
          setComplete(true);
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              label="email"
              name="email"
              placeholder="email"
              type="email"
            />
            <Button
              isDisabled={isSubmitting}
              mt={4}
              type="submit"
              variantColor="teal"
            >
              forgot password
            </Button>
            {complete && (
              <Box mt={4}>
                an email is sent to the email if an account
                exists
              </Box>
            )}
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(
  ForgotPassword
);
