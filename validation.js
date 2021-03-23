/**
 * Le Module que j'ai utilisé pour faire la validation
 * NPM : www.npmjs.com/package/joi
 * Site : https://joi.dev/api/?v=17.4.0
 */

// VALIDATION
const Joi = require('joi');

// Sign up Validation
const signUpValidation = (data) => {
  const schema = Joi.object({
    lastName: Joi.string().min(2).required(),
    firstName: Joi.string().min(3).required(),
    phoneNumber: Joi.string().min(10).required(),
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required(),
  });
  // Validate the data before make a user
  return schema.validate(data);
};

// Sign in Validation
const signInValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required(),
  });
  // Validate the data before make a user
  return schema.validate(data);
};

module.exports.signUpValidation = signUpValidation;
module.exports.signInValidation = signInValidation;
