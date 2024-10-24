const Joi = require("joi");

module.exports.CreateBugValidation = (body) => {
  const schema = Joi.object({
    title: Joi.string().min(3).required(),
    component: Joi.string().min(3).required(),
    priority: Joi.string().valid("high", "medium", "low").required(),
    description: Joi.string().min(10).required(),
    bugImage: Joi.optional(),
    assignedTo: Joi.string().required(),
  });

  return schema.validate(body);
};

module.exports.UpdateBugDetailsValidation = (body) => {
  const schema = Joi.object({
    title: Joi.string().min(3),
    component: Joi.string().min(3),
    priority: Joi.string().valid("high", "medium", "low"),
    description: Joi.string().min(10),
    assignedTo: Joi.string(),
  });

  return schema.validate(body);
};

module.exports.UpdateBugStatusValidation = (body) => {
  const schema = Joi.object({
    status: Joi.string().valid("pending", "inprogress", "completed").required(),
  });

  return schema.validate(body);
};
