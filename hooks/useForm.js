import { useState } from "react";
import Joi from "joi";
import { TextField } from "@shopify/polaris";

export default function useForm(data, schema, onSubmit) {
  const [errors, setErrors] = useState({});

  const joiSchema = Joi.object(schema);

  const validateProperty = (value, id) => {
    const obj = { [id]: value };
    const propSchema = Joi.object({ [id]: schema[id] });
    const { error } = propSchema.validate(obj);
    return error ? error.details[0].message : null;
  };

  const handleChange = (value, id, setValue) => {
    const errorMessage = validateProperty(value, id);
    if (errorMessage) errors[id] = errorMessage;
    else delete errors[id];

    setErrors(errors);
    setValue(value);
  };

  const validate = () => {
    const options = { abortEarly: false };
    const { error } = joiSchema.validate(data, options);
    if (!error) return {};

    const errors = {};
    for (let item of error.details) {
      errors[item.path[0]] = item.message;
    }
    console.log("errors", errors);
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    setErrors(errors);

    if (Object.keys(errors).length) return;

    await onSubmit();
  };

  const renderTextField = (id, label, value, setValue) => {
    return (
      <TextField
        id={id}
        label={label}
        value={value}
        onChange={(value, id) => handleChange(value, id, setValue)}
        error={errors ? errors[id] : ""}
      />
    );
  };

  return { errors, handleSubmit, renderTextField };
}
