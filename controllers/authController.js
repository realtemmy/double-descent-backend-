/* eslint-disable import/no-useless-path-segments */
const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const sendEmail = require("./../utils/email");

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

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    role: req.body.role,
  });

  const html = `
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 5px; box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #333;">Welcome to Our E-commerce Store!</h1>
        <p style="color: #666;">Dear ${newUser.name},</p>
        <p style="color: #666;">We’re super excited to see you join the Double Descent superstore community. Thank you for choosing us for your shopping needs. Our team is dedicated to providing you with a great shopping experience.</p>
        <p style="color: #666;">Here are some of the things you can expect from our store:</p>
        <ul>
            <li style="color: #666;">Wide selection of high-quality products</li>
            <li style="color: #666;">Competitive prices and exclusive discounts</li>
            <li style="color: #666;">Fast and secure checkout process</li>
            <li style="color: #666;">Excellent customer support</li>
        </ul>
        <p style="color: #666;">Our goal is to offer you the widest range of products at the highest quality. If you think we should add any items to our store, don’t hesitate to contact us and share your feedback.</p>
        <p style="color: #666;">Start exploring our products and enjoy shopping with us!</p>
        <a href="http://localhost:3000" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 3px; margin-top: 20px;">Shop Now</a>
        <p style="color: #666;">If you have any questions or need assistance, feel free to contact our customer support team.</p>
        <p style="color: #666;">Thank you for choosing us. We look forward to serving you.</p>
        <p style="color: #666;">Sincerely,<br>Your E-commerce Team</p>
    </div>
</body>
  `;

  try {
    await sendEmail({
      email: newUser.email,
      subject: "Welcome to double descent!",
      // message,
      html,
    });
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

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  // If account with email exist
  const user = await User.findOne({ email }).select("+password");

  if(user.isGoogle){
    return next(new AppError(`Account was created with google, please sign on using google sign in.`))
  }

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

  // const resetURL = `${req.protocol}://${req.get(
  //   "host"
  // )}/api/v1/resetPassword/${resetToken}`;

  const resetURL = `${process.env.FRONTEND_HOST}/reset-password/${resetToken}`;

  // const message = `Forgot your password? Submit a patched request with your new password and passwordConfirm to: ${resetURL}\n If you didn't forget please ignore this email.`;

  const html = `
    <h1>Password reset token</h1>
    <p>Forgot your password?</p>
    <div>Hey, from double descent store, click the button below to request a new password</div>
    <button><a href=${resetURL}>Forgot password</a></button>
    <p>If you didn't request forget  password, please ignore this email.</p>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token",
      // message,
      html,
    });
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
  user.confirmPassword = req.body.confirmPassword;
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
};

exports.googleLogin = catchAsync(async (req, res, next) => {
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

exports.googleSignUp = catchAsync(async (req, res, next) => {
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

  const html = `
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 5px; box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #333;">Welcome to Our E-commerce Store!</h1>
        <p style="color: #666;">Dear ${newUser.name},</p>
        <p style="color: #666;">We’re super excited to see you join the Double Descent superstore community. Thank you for choosing us for your shopping needs. Our team is dedicated to providing you with a great shopping experience.</p>
        <p style="color: #666;">Here are some of the things you can expect from our store:</p>
        <ul>
            <li style="color: #666;">Wide selection of high-quality products</li>
            <li style="color: #666;">Competitive prices and exclusive discounts</li>
            <li style="color: #666;">Fast and secure checkout process</li>
            <li style="color: #666;">Excellent customer support</li>
        </ul>
        <p style="color: #666;">Our goal is to offer you the widest range of products at the highest quality. If you think we should add any items to our store, don’t hesitate to contact us and share your feedback.</p>
        <p style="color: #666;">Start exploring our products and enjoy shopping with us!</p>
        <a href="http://localhost:3000" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 3px; margin-top: 20px;">Shop Now</a>
        <p style="color: #666;">If you have any questions or need assistance, feel free to contact our customer support team.</p>
        <p style="color: #666;">Thank you for choosing us. We look forward to serving you.</p>
        <p style="color: #666;">Sincerely,<br>Your E-commerce Team</p>
    </div>
</body>
  `;

  try {
    await sendEmail({
      email: newUser.email,
      subject: "Welcome to double descent!",
      // message,
      html,
    });
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

exports.googleAuth = catchAsync(async (req, res, next) => {});
