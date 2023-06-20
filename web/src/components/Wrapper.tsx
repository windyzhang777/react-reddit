import { Box } from "@chakra-ui/core";
import { FC } from "react";

export type WrapperVariant = "small" | "regular";

interface WrapperProps {
  variant?: WrapperVariant;
}

const Wrapper: FC<WrapperProps> = ({
  variant = "regular",
  children,
}) => {
  return (
    <Box
      mt={4}
      mx="auto"
      maxW={variant === "regular" ? "800px" : "400px"}
      w="100%"
    >
      {children}
    </Box>
  );
};

export default Wrapper;
