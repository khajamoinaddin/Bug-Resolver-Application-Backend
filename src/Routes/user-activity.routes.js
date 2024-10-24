const express = require("express");
const {
  Authentication,
  Authorization,
} = require("../Middlewares/Auth.middleware");
const ROLES = require("../Constants/roles");
const {
  GetUserReportsController,
} = require("../Controllers/useractivity.controller");

const UserActivityRoutes = express.Router();

UserActivityRoutes.route("/my-reports").get(
  Authentication,
  GetUserReportsController
);

UserActivityRoutes.route("/admin/single-user-reports/:userid").get(
  Authentication,
  Authorization(ROLES.MANAGER),
  GetUserReportsController
);

module.exports = UserActivityRoutes;
