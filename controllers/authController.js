/* eslint-disable import/no-useless-path-segments */
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  });
  // eslint-disable-next-line no-underscore-dangle
  const token = signToken(newUser._id);

  res.status(201).json({
    status: "success",
    token,
    data: { newUser },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  // If account with email exist
  const user = await User.findOne({ email }).select("+password");
  console.log(user);

  // Check if password inputed is equal to the password in DB
  if (!user || !(await user.comparePasswords(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    token,
  });

  // compare passwords
});
