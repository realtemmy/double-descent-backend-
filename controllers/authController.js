/* eslint-disable import/no-useless-path-segments */
const { promisify } = require("util");
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
    // passwordChangedAt: req.body.passwordChangedAt,
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

exports.protect = catchAsync(async (req, res, next) => {
  // 1) check if there's a token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    next(new AppError("You are not logged in! Login to get access", 401));
  }

  // verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);
  // check if the user exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The account belonging to this token does not exist! Please log in again",
        401
      )
    );
  }

  // if user changed password
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please Log in again.", 401)
    );
  }

  // Grant accessto route
  req.user = currentUser;
  next();
});

exports.restrict = catchAsync((req, res, next) => {
  // might later use isAdmin in userModel, remember to change.
  if (!req.user.role === "admin") {
    return next(
      new AppError("You do not have access to perform this action", 401)
    );
  }
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on the email POSTed
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email address", 404));
  }
  // Generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
});

exports.resetPassword = catchAsync(async (req, res, next) => {});
