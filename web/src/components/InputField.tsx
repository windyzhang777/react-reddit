import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Textarea,
} from "@chakra-ui/core";
import { useField } from "formik";
import { FC, InputHTMLAttributes } from "react";

type InputFieldProps =
  InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    name: string;
    textarea?: boolean;
  };

const InputField: FC<InputFieldProps> = ({
  size: _,
  textarea,
  ...props
}) => {
  // switch between <Input /> and <Textarea />
  let InputType = Input;
  if (textarea) {
    InputType = Textarea;
  }
  const [field, { error }] = useField(props);
  return (
    <FormControl isInvalid={!!error}>
      <FormLabel htmlFor={props.name}>
        {props.label}
      </FormLabel>
      <InputType {...field} {...props} id={field.name} />
      {!!error && (
        <FormErrorMessage>{error}</FormErrorMessage>
      )}
    </FormControl>
  );
};

export default InputField;
