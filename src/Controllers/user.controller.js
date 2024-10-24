const httpErrors = require("http-errors");
const logger = require("../Config/applogger.config");
const {
  RegisterUserValidation,
  LoginUserValidation,
  UpdateUserProfileValidation,
} = require("../Validations/user.joi");
const userModel = require("../Models/user.model");
const userActivityModel = require("../Models/useractivity.model");
const {
  USER_ALREADY_EXISTS,
  SUCCESSFULLY_USER_CREATED,
  INVALID_EMAIL_PASSWORD,
  SUCCESSFULLY_USER_LOGIN,
  SUCCESSFULLY_USER_DETAILS_UPDATED,
  USER_NOT_FOUND,
  SUCCESSFULLY_USER_LOGOUT,
} = require("../Constants/user.contant");
const { VerifyPasswordMethod } = require("../Utils/verifypassword");
const { CreateAcessToken } = require("../Utils/jwt.token");
const moment = require("moment");

// login
module.exports.LoginUserController = async (req, res, next) => {
  try {
    logger.warn("Controller-user.controller-LoginUserController-start");

    const { error } = LoginUserValidation(req.body);
    if (error) return next(httpErrors.BadRequest(error.details[0].message));

    const { email, password } = req.body;
    const userExist = await userModel
      .findOne({ email })
      .select("+password")
      .lean();

    if (!userExist) return next(httpErrors.NotFound(INVALID_EMAIL_PASSWORD));

    const isPasswordCorrect = await VerifyPasswordMethod(
      password,
      userExist.password
    );
    if (!isPasswordCorrect) {
      return next(httpErrors.NotFound(INVALID_EMAIL_PASSWORD));
    }

    delete userExist.password;

    // user login activity logic here
    const today = new Date();
    const startDate = new Date(today.setHours(0, 0, 0, 0));
    const endDate = new Date(today.setHours(23, 59, 59, 999));

    const isExistToday = await userActivityModel.findOne({
      date: {
        $gte: startDate,
        $lt: endDate,
      },
      userId: userExist._id,
    });
    const currentDate = moment().format();

    if (!isExistToday) {
      const activityData = {
        userId: userExist._id,
        date: currentDate,
        sessions: [
          {
            login: {
              inTime: currentDate,
              timeFormat: moment(currentDate).format("hh:mm A"),
            },
          },
        ],
      };
      await userActivityModel.create(activityData);
    } else {
      await userActivityModel.findByIdAndUpdate(isExistToday._id, {
        $push: {
          sessions: {
            login: {
              inTime: currentDate,
              timeFormat: moment(currentDate).format("hh:mm A"),
            },
          },
        },
      });
    }

    let payload = {
      id: userExist._id,
      role: userExist.role,
    };
    const accessToken = await CreateAcessToken(payload);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: SUCCESSFULLY_USER_LOGIN,
      details: userExist,
      accessToken,
      role: payload.role,
    });

    logger.warn("Controller-user.controller-LoginUserController-End");
  } catch (error) {
    logger.error("Controller-user.controller-LoginUserController-error", error);
    next(httpErrors.InternalServerError(error.message));
  }
};

// register
module.exports.RegisterUserController = async (req, res, next) => {
  try {
    logger.warn("Controller-user.controller-RegisterUserController-start");
    const { error } = RegisterUserValidation(req.body);
    if (error) return next(httpErrors.BadRequest(error.details[0].message));

    const isUserExit = await userModel.findOne({ email: req.body.email });
    if (isUserExit) return next(httpErrors.BadRequest(USER_ALREADY_EXISTS));
    const user = new userModel(req.body);
    await user.save();
    logger.warn("Controller-user.controller-RegisterUserController-End");
    res.status(201).json({
      success: true,
      statusCode: 201,
      message: SUCCESSFULLY_USER_CREATED,
    });
  } catch (error) {
    logger.error(
      "Controller-user.controller-RegisterUserController-error",
      error
    );
    next(httpErrors.InternalServerError(error.message));
  }
};

// logout
module.exports.LogoutUserController = async (req, res, next) => {
  try {
    logger.warn("Controller-user.controller-LogoutUserController-Start");

    const today = new Date();
    const startDate = new Date(today.setHours(0, 0, 0, 0));
    const endDate = new Date(today.setHours(23, 59, 59, 999));

    const isExistToday = await userActivityModel
      .findOne({
        date: {
          $gte: startDate,
          $lt: endDate,
        },
        userId: req.user._id,
      })
      .lean();
    const currentDate = moment().format();

    if (
      isExistToday &&
      isExistToday.sessions.length &&
      isExistToday.sessions[isExistToday.sessions.length - 1]?.login &&
      !isExistToday.sessions[isExistToday.sessions.length - 1]?.logout
    ) {
      let lastLogin = isExistToday.sessions[isExistToday.sessions.length - 1];

      const logout = {
        outTime: currentDate,
        timeFormat: moment(currentDate).format("hh:mm A"),
      };
      const timeDifference = moment(currentDate).diff(
        moment(lastLogin?.login?.inTime),
        "hours",
        true
      );

      lastLogin = {
        ...lastLogin,
        logout,
        timeDifference: Number(timeDifference.toFixed(2)),
      };

      console.log(lastLogin);

      isExistToday.sessions[isExistToday.sessions.length - 1] = lastLogin;
      await userActivityModel.findByIdAndUpdate(isExistToday._id, {
        sessions: isExistToday.sessions,
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: SUCCESSFULLY_USER_LOGOUT,
      isExistToday,
    });
  } catch (error) {
    logger.error(
      "Controller-user.controller-LogoutUserController-error",
      error
    );
    next(httpErrors.InternalServerError(error.message));
  }
};

// user my profile
module.exports.MyProfileUserController = async (req, res, next) => {
  try {
    logger.warn("Controller-user.controller-MyProfileUserController-start");
    const userDetails = req.user;
    res.status(200).json({
      success: true,
      statusCode: 200,
      data: userDetails,
    });
    logger.warn("Controller-user.controller-MyProfileUserController-End");
  } catch (error) {
    logger.error(
      "Controller-user.controller-MyProfileUserController-error",
      error
    );
    next(httpErrors.InternalServerError(error.message));
  }
};

// update user profile
module.exports.UpdateMyProfileController = async (req, res, next) => {
  try {
    logger.warn("Controller-user.controller-UpdateUserProfileController-start");
    const { error } = UpdateUserProfileValidation(req.body);
    if (error) return next(httpErrors.BadRequest(error.details[0].message));

    const details = await userModel.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
    });
    logger.warn("Controller-user.controller-UpdateUserProfileController-End");
    res.status(200).json({
      success: true,
      statuscode: 200,
      message: SUCCESSFULLY_USER_DETAILS_UPDATED,
      data: details,
    });
  } catch {
    logger.error(
      "Controller-user.controller-UpdateUserProfileController-End",
      error
    );
    return next(httpErrors.InternalServerError());
  }
};

//------------------------------- for manager (admin) ------------------------------------
// get all users
module.exports.GetAllUsersController = async (req, res, next) => {
  try {
    logger.warn("Controller-user.GetAllUserscontroller-Controller-start");
    const { limit = 15, page = 1 } = req.query;
    const skip_docs = (page - 1) * limit;
    const data = await userModel
      .find()
      .skip(skip_docs)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalDocuments = await userModel.countDocuments();

    logger.warn("Controller-user.GetAllUserscontroller-Controller-End");
    res.status(200).json({
      success: true,
      statuscode: 200,
      data,
      totalDocuments,
    });
  } catch (error) {
    logger.error(
      "Controller-user.GetAllUserscontroller-Controller-Error",
      error
    );
    next(httpErrors.InternalServerError());
  }
};

// get single user details
module.exports.GetSingleUserDetailController = async (req, res, next) => {
  try {
    logger.warn("Controller-user.GetSingleUserDetailcontroller-start");
    const { userid } = req.params;
    const data = await userModel.findById(userid);
    if (!data) return next(httpErrors.NotFound(USER_NOT_FOUND));

    logger.warn("Controller-user.GetSingleUserDetailcontroller-End");
    res.status(200).json({
      success: true,
      statuscode: 200,
      data,
    });
  } catch (error) {
    logger.warn("Controller-user.GetSingleUserDetailcontroller-Error", error);
    next(httpErrors.InternalServerError());
  }
};

// ------------------------------ public routes -----------------
module.exports.GetUsersNamesList = async (req, res, next) => {
  try {
    const data = await userModel.find().select("name");
    res.status(200).json({ success: true, statusCode: 200, data });
  } catch (error) {
    next(httpErrors.InternalServerError());
  }
};
