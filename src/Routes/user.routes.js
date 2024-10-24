const express = require("express");
const {
  RegisterUserController,
  LoginUserController,
  MyProfileUserController,
  UpdateMyProfileController,
  GetAllUsersController,
  GetSingleUserDetailController,
  LogoutUserController,
  GetUsersNamesList,
} = require("../Controllers/user.controller");
const {
  Authentication,
  Authorization,
} = require("../Middlewares/Auth.middleware");
const ROLES = require("../Constants/roles");

const UserRoutes = express.Router();

UserRoutes.route("/login").post(LoginUserController);

UserRoutes.route("/register").post(RegisterUserController);

UserRoutes.route("/logout").get(Authentication, LogoutUserController);

UserRoutes.route("/my-profile")
  .get(Authentication, MyProfileUserController)
  .put(Authentication, UpdateMyProfileController);

// --------------- Manager roles (admin) --------------------------

UserRoutes.route("/admin/all-users").get(
  Authentication,
  Authorization(ROLES.MANAGER),
  GetAllUsersController
);

UserRoutes.route("/admin/:userid").get(
  Authentication,
  Authorization(ROLES.MANAGER),
  GetSingleUserDetailController
);

// ------------------- public rotues --------------------------------
UserRoutes.route("/users-names").get(Authentication, GetUsersNamesList);

module.exports = UserRoutes;
