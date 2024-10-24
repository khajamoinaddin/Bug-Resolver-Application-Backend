const httpErrors = require("http-errors");
const { VerifyAccessToken } = require("../Utils/jwt.token");
const {
  AUTHENTICATION_TOKEN_REQUIRED,
  AUTHORIZATION_REQUIRED,
} = require("../Constants/auth.constant");
const userModel = require("../Models/user.model");
const { USER_NOT_FOUND } = require("../Constants/user.contant");

// for authentication
module.exports.Authentication = async (req, res, next) => {
  try {
    const authHeader = req.header("authorization");
    const accessToken = authHeader.replace("Bearer ", "");

    if (!authHeader || !accessToken) {
      return next(httpErrors.Unauthorized(AUTHENTICATION_TOKEN_REQUIRED));
    }

    const decode = await VerifyAccessToken(accessToken);
    if (!decode.success) {
      return next(httpErrors.Unauthorized(decode.error.message));
    }

    const user = await userModel.findById(decode.id);
    if (!user) {
      return next(httpErrors.NotFound(USER_NOT_FOUND));
    }
    req.user = user;

    console.log(`req name: ${user.email} role:${user.role}`);
    next();
  } catch (error) {
    next(httpErrors.InternalServerError(error.message));
  }
};

// authorization depending  upon a role
module.exports.Authorization = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(httpErrors.Unauthorized(AUTHORIZATION_REQUIRED));
    }
    next();
  };
};
