/* eslint-disable no-param-reassign */
const AppError = require("./../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  const newErr = new AppError(message, 400);
  console.log(newErr);
  return newErr;
};

const handleDuplicateError = (err) => {
  console.log("Duplicate: ", err);
  const message = `Duplicate value of ${JSON.stringify(err.keyValue)}`;
  const dupErr = new AppError(message, 401);
  return dupErr;
};

const sendErrorDev = (err, res) => {
  console.log("Error: ", err);
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Trusted error I've accounted for
  console.log("Error prod: ", err);
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error("Error: ", err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

const handleJWTError = () =>
  new AppError("Invalid token! Please login in again.", 401);
const handleExpiredJWTError = () =>
  new AppError("Your session has expired! Please log in again.", 401);

module.exports = (err, req, res, next) => {
  console.log("All err: ", err.message);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {

    if (err.name === "CastError") err = handleCastErrorDB(err);
    if (err.name === "JsonWebTokenError") err = handleJWTError();
    if (err.name === "TokenExpiredError") err = handleExpiredJWTError();
    if (err.code === 11000) err = handleDuplicateError(err);

    sendErrorProd(err, res);
  }
  next();
};
