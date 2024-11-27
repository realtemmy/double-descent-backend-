/* eslint-disable import/no-useless-path-segments */
const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const AppError = require("./../utils/appError");
// const sendEmail = require("./../utils/email");
const Email = require("./../utils/email");
const asyncHandler = require("express-async-handler");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Cookies settings
  const cookieOptions = {
    expiresIn:
      new Date() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }

  res.cookie("jwt", token, cookieOptions);

  // Send response
  res.status(statusCode).json({
    status: "success",
    token,
    data: user,
  });
};

exports.signup = asyncHandler(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    role: req.body.role,
  });

  try {
    const email = new Email(newUser, "http://localhost:3000");
    await email.sendWelcome();
    createSendToken(newUser, 201, res);
  } catch (error) {
    return next(
      new AppError(
        "There was an error sending the email. Please try again later!",
        500
      )
    );
  }
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  // If account with email exist
  const user = await User.findOne({ email }).select("+password");

  if (user.isGoogle) {
    return next(
      new AppError(
        `Account was created with google, please sign on using google sign in.`
      )
    );
  }

  // Check if password inputed is equal to the password in DB ie compare passwords
  if (!user || !(await user.comparePasswords(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  createSendToken(user, 200, res);
});

exports.protect = asyncHandler(async (req, res, next) => {
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

exports.restrictToAdmin = catchAsync((req, res, next) => {
  // might later use isAdmin in userModel, remember to change.
  if (!req.user.role === "admin") {
    return next(
      new AppError("You do not have access to perform this action", 401)
    );
  }
  next();
});

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email address", 404));
  }

  // Generate a random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `http://localhost:3000/reset-password/${resetToken}`;

  try {
    const email = new Email(user, resetURL);
    await email.sendPasswordReset();
    res.status(200).json({
      status: "success",
      message: "Token sent to mail",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Please try again later!",
        500
      )
    );
  }
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  // 1) Get userbased on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordExpiresAt: { $gt: Date.now() },
  });
  // if token has not expired and there is user, set the new password
  if (!user) {
    return next(new AppError("Invalid or expired token", 400));
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordExpiresAt = undefined;
  // Log in user, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = asyncHandler(async (req, res, next) => {
  // Create a field for currentPassword, and new password as password to be able to change

  // Get user from collection
  const user = await User.findById(req.user.id).select("+password");
  // check if currentPassword matches the one in DB
  if (!(await user.comparePasswords(req.body.currentPassword, user.password))) {
    return next(new AppError("Your current password is wrong!", 401));
  }
  // Update password with the one coming from user
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  // then save to DB
  await user.save();
  // Log user in
  createSendToken(user, 200, res);
});

exports.googleLogin = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  // 1) Check if account exists and is a google type with email
  const user = await User.findOne({ email }).select("+isGoogle");

  // 2) if account was not created by google login, throw error
  if (!user || !user.isGoogle) {
    return next(new AppError(`Email is not registered with google login`));
  }

  // 3) allow login, send jwt, response etc
  createSendToken(user, 200, res);
});

exports.googleSignUp = asyncHandler(async (req, res, next) => {
  const { email, picture, given_name } = req.body;
  // check if email already exists in database
  const user = await User.findOne({ email });

  // if it does, throw error that email already exists
  if (user) {
    return next(new AppError(`Email already exists`, 403));
  }

  const newUser = new User({
    name: given_name,
    email,
    photo: picture,
    isGoogle: true,
  });

  // disable validation before save
  await newUser.save({ validateBeforeSave: false });

  try {
    const email = new Email(newUser, "http://localhost:3000");
    await email.sendWelcome();
    createSendToken(newUser, 201, res);
  } catch (error) {
    return next(
      new AppError(
        "There was an error sending the email. Please try again later!",
        500
      )
    );
  }
});

exports.googleAuth = asyncHandler(async (req, res, next) => {});
