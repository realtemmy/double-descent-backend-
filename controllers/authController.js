/* eslint-disable import/no-useless-path-segments */
const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const sendEmail = require(".././utils/email");

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
    data: { user },
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
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  // If account with email exist
  const user = await User.findOne({ email }).select("+password");

  // Check if password inputed is equal to the password in DB ie compare passwords
  if (!user || !(await user.comparePasswords(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  createSendToken(user, 200, res);
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

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email address", 404));
  }
  // Generate a random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a patched request with your new password and passwordConfirm to: ${resetURL}\n If you didn't forget please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token",
      message,
    });
    res.status(200).json({
      status: "success",
      message: "Token sent to mail",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Please try again later!",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
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
  user.confirmPassword = req.body.conformPassword;
  user.passwordResetToken = undefined;
  user.passwordExpiresAt = undefined;
  // Log in user, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = async (req, res, next) => {
  // Create a field for currentPassword, and new password as password to be able to change

  // Get user from collection
  const user = await User.findById(req.user.id).select("+password");
  // check if currentPassword matches the one in DB
  if (!(await user.comparePasswords(user.password, req.body.currentPassword))) {
    return next(new AppError("Your current password is wrong!", 401));
  }
  // Update password with the one coming from user
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  // then save to DB
  await user.save();
  // Log user in
  createSendToken(user, 200, res);
};
