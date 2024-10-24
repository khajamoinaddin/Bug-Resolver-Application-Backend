const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

// register schema
module.exports.RegisterUserValidation = (body) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: passwordComplexity().required(),
    phone: Joi.string().required(),
    address: Joi.string(),
  });

  return schema.validate(body);
};

// login schema
module.exports.LoginUserValidation = (body) => {
  const schema = Joi.object({
    email: Joi.string().email().required().label("email"),
    password: passwordComplexity().required().label("password"),
  });

  return schema.validate(body);
};

// update user details
module.exports.UpdateUserProfileValidation = (body) => {
  const schema = Joi.object({
    name: Joi.string(),
    phone: Joi.string(),
    address: Joi.string(),
  });

  return schema.validate(body);
};

// updating the  password
module.exports.UpdatePasswordValidation = (body) => {
  const schema = Joi.object({
    old_password: passwordComplexity().required().label("Old Password"),
    new_password: passwordComplexity().required().label("New Password"),
  });
  return schema.validate(body);
};
