const mongoose = require("mongoose");

const ModelSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    sessions: [
      {
        login: {
          inTime: {
            type: Date,
          },
          timeFormat: {
            type: String,
          },
        },
        logout: {
          outTime: {
            type: Date,
          },
          timeFormat: {
            type: String,
          },
        },
        timeDifference: {
          type: Number,
        },
      },
    ],
  },
  { timestamps: true }
);

const userActivityModel = mongoose.model("useractivity", ModelSchema);

module.exports = userActivityModel;
