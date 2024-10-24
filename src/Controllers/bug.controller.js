const httpErrors = require("http-errors");
const logger = require("../Config/applogger.config");
const userModel = require("../Models/user.model");
const userActivityModel = require("../Models/useractivity.model");
const bugModel = require("../Models/bug.model");
const moment = require("moment");
const {
  CreateBugValidation,
  UpdateBugDetailsValidation,
  UpdateBugStatusValidation,
} = require("../Validations/bug.joi");
const {
  SUCCESSFULLY_BUG_CREATED,
  BUG_DELETED_SUCCESSFULLY,
  BUG_NOT_FOUND,
} = require("../Constants/bug.constant");
const cloudinary = require("cloudinary");

// create new bug
module.exports.CreateNewBugController = async (req, res, next) => {
  try {
    logger.warn("Controller-bug.controller-CreatedBugController-Start");
    const { error } = CreateBugValidation(req.body);
    if (error) return next(httpErrors.BadRequest(error.details[0].message));

    const bugimage = req.file;

    const details = {
      ...req.body,
      createdBy: req.user._id,
    };

    if (bugimage) {
      const myCloud = await cloudinary.v2.uploader.upload(bugimage.path, {
        folder: "Bugs_Project/Bugs",
      });

      details.image = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    const data = new bugModel(details);
    await data.save();
    logger.warn("Controller-bug.controller-CreatedBugController-End");
    res.status(201).json({
      success: true,
      statusCode: 201,
      message: SUCCESSFULLY_BUG_CREATED,
      data,
    });
  } catch (error) {
    logger.error("Controller-bug.controller-CreatedBugController-error", error);
    next(httpErrors.InternalServerError(error.message));
  }
};

// single bug details
module.exports.SingleBugDetailsController = async (req, res, next) => {
  try {
    logger.warn("Controller-bug.controller-SingleBugDetailsController-Start");
    const { bugid } = req.params;
    const data = await bugModel
      .findById(bugid)
      .populate("createdBy", "email")
      .populate("assignedTo", "email")
      .populate("updatedBy", "email");

    if (!data) return next(httpErrors.NotFound(BUG_NOT_FOUND));

    logger.warn("Controller-bug.controller-SingleBugDetailsController-End");
    res.status(200).json({
      success: true,
      statusCode: 200,
      data,
    });
  } catch (error) {
    logger.error(
      "Controller-bug.controller-SingleBugDetailsController-error",
      error
    );
    next(httpErrors.InternalServerError(error.message));
  }
};

// delete bug
module.exports.DeleteBugController = async (req, res, next) => {
  try {
    logger.warn("Controller-bug.controller-DeleteBugController-Start");
    const { bugid } = req.params;
    const data = await bugModel.findByIdAndDelete(bugid);
    if (!data) return next(httpErrors.NotFound(BUG_NOT_FOUND));
    logger.warn("Controller-bug.controller-DeleteBugController-End");
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: BUG_DELETED_SUCCESSFULLY,
    });
  } catch (error) {
    logger.error("Controller-bug.controller-DeleteBugController-error", error);
    next(httpErrors.InternalServerError(error.message));
  }
};

// update bug details
module.exports.UpdateBugDetailsController = async (req, res, next) => {
  try {
    logger.warn("Controller-bug.controller-UpdateDetailsBugController-Start");
    const { bugid } = req.params;
    const { error } = UpdateBugDetailsValidation(req.body);
    if (error) return next(httpErrors.BadRequest(error.details[0].message));

    const data = await bugModel.findByIdAndUpdate(bugid, req.body, {
      new: true,
    });
    if (!data) return next(httpErrors.NotFound(BUG_NOT_FOUND));
    logger.warn("Controller-bug.controller-UpdateDetailsBugController-End");
    res.status(200).json({
      success: true,
      statusCode: 200,
      data,
    });
  } catch (error) {
    logger.error(
      "Controller-bug.controller-UpdateBugDetailsController-error",
      error
    );
    next(httpErrors.InternalServerError(error.message));
  }
};

// update bug status
module.exports.UpdateBugStatusController = async (req, res, next) => {
  try {
    logger.warn("Controller-bug.controller-UpdateBugStatusController-Start");
    const { bugid } = req.params;
    const { error } = UpdateBugStatusValidation(req.body);
    if (error) return next(httpErrors.BadRequest(error.details[0].message));
    req.body.updatedBy = req.user._id;
    if (req.body.status === "completed") {
      req.body.completedOn = moment().format();
    }
    const data = await bugModel.findByIdAndUpdate(bugid, req.body, {
      new: true,
    });
    if (!data) return next(httpErrors.NotFound(BUG_NOT_FOUND));
    logger.warn("Controller-bug.controller-UpdateBugStatusController-End");
    res.status(200).json({
      success: true,
      statusCode: 200,
      data,
    });
  } catch (error) {
    logger.error(
      "Controller-bug.controller-UpdateBugStatusController-error",
      error
    );
    next(httpErrors.InternalServerError(error.message));
  }
};

// get all bugs
module.exports.GetAllBugsController = async (req, res, next) => {
  try {
    logger.warn("Controller-bug.controller-GetAllBugsController-Start");
    const { limit = 15, page = 1, status = "*", priority = "*" } = req.query;
    const skip_docs = (page - 1) * limit;

    const query = {};

    if (status !== "*") {
      query.status = status;
    }

    if (priority !== "*") {
      query.priority = priority;
    }

    const data = await bugModel
      .find(query)
      .skip(skip_docs)
      .limit(limit)
      .populate("assignedTo", "name")
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .sort({ createdAt: -1 });
    const totalDocuments = await bugModel.countDocuments();

    logger.warn("Controller-bug.controller-GetAllBugsController-End");
    res.status(200).json({
      success: true,
      statusCode: 200,
      data,
      totalDocuments,
    });
  } catch (error) {
    logger.error("Controller-bug.controller-GetAllBugsController-error", error);
    next(httpErrors.InternalServerError(error.message));
  }
};

// bugs graph data
module.exports.GetBugsReportGraphController = async (req, res, next) => {
  try {
    logger.warn("Controller-bug.controller-GetBugsReportGraphController-Start");

    const priorityReport = await bugModel.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const statusReport = await bugModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const combinedReport = await bugModel.aggregate([
      {
        $group: {
          _id: {
            priority: "$priority",
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: {
        priorityReport,
        statusReport,
        combinedReport,
      },
    });
  } catch (error) {
    logger.error(
      "Controller-bug.controller-GetBugsReportGraphController-error",
      error
    );
    next(httpErrors.InternalServerError(error.message));
  }
};

// get all bugs created  by me
module.exports.GetCreatedAllMyBugsController = async (req, res, next) => {
  try {
    logger.warn(
      "Controller-bug.controller-GetCreatedAllMyBugsController-Start"
    );
    const data = await bugModel
      .find({ createdBy: req.user._id })
      .populate("assignedTo", "name")
      .populate("updatedBy", "name")
      .sort({ createdAt: -1 });

    logger.warn("Controller-bug.controller-GetCreatedAllMyBugsController-End");
    res.status(200).json({
      success: true,
      statusCode: 200,
      data,
    });
  } catch (error) {
    logger.error(
      "Controller-bug.controller-GetCreatedAllMyBugsController-error",
      error
    );
    next(httpErrors.InternalServerError(error.message));
  }
};

// get all bugs assigned to me
module.exports.GetAssignedAllMyBugsController = async (req, res, next) => {
  try {
    logger.warn(
      "Controller-bug.controller-GetAssignedAllMyBugsController-Start"
    );
    const data = await bugModel
      .find({ assignedTo: req.user._id })
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .sort({ createdAt: -1 });

    logger.warn("Controller-bug.controller-GetAssignedAllMyBugsController-End");
    res.status(200).json({
      success: true,
      statusCode: 200,
      data,
    });
  } catch (error) {
    logger.error(
      "Controller-bug.controller-GetAssignedAllMyBugsController-error",
      error
    );
    next(httpErrors.InternalServerError(error.message));
  }
};
