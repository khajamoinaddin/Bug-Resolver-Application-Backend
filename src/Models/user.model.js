const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { required } = require("joi");

const ModelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      select: false,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    profile: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    address: {
      type: String,
    },
    role: {
      type: String,
      default: "employee",
      enum: ["employee", "manager"],
    },
  },

  { timestamps: true }
);

ModelSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

const userModel = mongoose.model("user", ModelSchema);

module.exports = userModel;
