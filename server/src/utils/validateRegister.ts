import { FieldError } from "src/resolver/UserResponse";
import { UsernamePasswordInput } from "../resolver/UsernamePasswordInput";

export const validateRegister = (
  credentials: UsernamePasswordInput
): FieldError[] | null => {
  if (credentials.username.length <= 2) {
    return [
      {
        field: "username",
        message: "username too short (>2)",
      },
    ];
  }
  if (credentials.username.includes("@")) {
    return [
      {
        field: "username",
        message: "invalid username",
      },
    ];
  }
  if (!credentials.email.includes("@")) {
    return [
      {
        field: "email",
        message: "invalid email",
      },
    ];
  }
  if (credentials.password.length <= 2) {
    return [
      {
        field: "password",
        message: "password too short (>2)",
      },
    ];
  }

  return null;
};
