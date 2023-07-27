"use strict";

const { default: mongoose } = require("mongoose");

const QrLoginModel = mongoose.Schema(
  {
    users: {
      type: [String],
    },
    deleted: {
      type: [Boolean],
      default: [false, false],
    },
  },
  {
    timestamps: true,
  }
);

const QrLogin = mongoose.model("QrLogin", QrLoginModel);

module.exports = QrLogin;
