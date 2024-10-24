const express = require("express");
const {
  Authentication,
  Authorization,
} = require("../Middlewares/Auth.middleware");
const ROLES = require("../Constants/roles");
const {
  GetUserReportsController,
} = require("../Controllers/useractivity.controller");
const {
  CreateNewBugController,
  SingleBugDetailsController,
  DeleteBugController,
  UpdateBugDetailsController,
  UpdateBugStatusController,
  GetAllBugsController,
  GetBugsReportGraphController,
  GetCreatedAllMyBugsController,
  GetAssignedAllMyBugsController,
} = require("../Controllers/bug.controller");
const { BugImageUpload } = require("../Middlewares/multer.middleware");

const BugRoutes = express.Router();

BugRoutes.route("/create-bug").post(
  Authentication,
  BugImageUpload,
  CreateNewBugController
);

BugRoutes.route("/all-bugs").get(GetAllBugsController);

BugRoutes.route("/created-by-me").get(
  Authentication,
  GetCreatedAllMyBugsController
);
BugRoutes.route("/assigned-to-me").get(
  Authentication,
  GetAssignedAllMyBugsController
);

BugRoutes.route("/graph-report").get(GetBugsReportGraphController);

BugRoutes.route("/single-bug/:bugid")
  .get(Authentication, SingleBugDetailsController)
  .delete(Authentication, DeleteBugController)
  .put(Authentication, UpdateBugDetailsController)
  .patch(Authentication, UpdateBugStatusController);

module.exports = BugRoutes;
