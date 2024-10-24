const express = require("express");
const UserRoutes = require("./user.routes");
const UserActivityRoutes = require("./user-activity.routes");
const BugRoutes = require("./bug.routes");

// Route config
const IndexRoutes = express.Router();

//  using a routes
IndexRoutes.use("/user", UserRoutes);

IndexRoutes.use("/user-activity", UserActivityRoutes);

IndexRoutes.use("/bug", BugRoutes);

// export the routes
module.exports = IndexRoutes;
