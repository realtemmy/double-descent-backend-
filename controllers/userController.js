/* eslint-disable import/no-useless-path-segments */
const catchAsync = require("./../utils/catchAsync");
const User = require("./../models/userModel");

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    results: users.length,
    data: { users },
  });
});

exports.getUser = async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "this route isn't defined yet",
  });
};

exports.createUser = async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "this route isn't defined yet",
  });
};

exports.updateUser = async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "this route isn't defined yet",
  });
};

exports.deleteUser = async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "this route isn't defined yet",
  });
};
