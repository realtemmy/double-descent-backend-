/* eslint-disable import/no-useless-path-segments */
const catchAsync = require("./../utils/catchAsync");
const User = require("./../models/userModel");
const AppError = require("./../utils/appError");

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    results: users.length,
    data: { users },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  console.log(req.params.id);
  const users = await User.findById(req.params.id);
  if(!user){
    return next(new AppError("No user found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: { users },
  });
});

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
