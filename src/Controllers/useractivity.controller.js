const httpErrors = require("http-errors");
const logger = require("../Config/applogger.config");
const userModel = require("../Models/user.model");
const userActivityModel = require("../Models/useractivity.model");
const moment = require("moment");

module.exports.GetUserReportsController = async (req, res, next) => {
  try {
    logger.warn("Controller-user.GetUserReportscontroller-Start");
    const { startDate = null, endDate = null } = req.query;
    const { userid } = req.params;

    let start = startDate
      ? moment(startDate, "DD-MM-YYYY").startOf("day")
      : moment().startOf("month");

    let end = endDate
      ? moment(endDate, "DD-MM-YYYY").endOf("day")
      : moment().endOf("day");

    const query = {
      userId: userid || req.user._id,
      date: {
        $gte: start.format(),
        $lte: end.format(),
      },
    };

    const data = await userActivityModel.find(query);
    logger.warn("Controller-user.GetUserReportscontroller-End");
    res.status(200).json({
      success: true,
      statusCode: 200,
      data,
    });
  } catch (error) {
    logger.error("Controller-user.GetUserReportscontroller-Error", error);
    next(httpErrors.InternalServerError());
  }
};

// ------- Manager Controllers --------------------
