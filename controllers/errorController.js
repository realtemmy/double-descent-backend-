/* eslint-disable no-param-reassign */
const AppError = require("./../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  const newErr = new AppError(message, 400);
  console.log(newErr);
  return newErr;
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Trusted error I've accounted for.
  console.log("OPERATIONAL: ", err.isOperational);
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

const handleJWTError = () => new AppError('Invalid token! Please login in again.', 401)
const handleExpiredJWTError = () => new AppError('Your session has expired! Please log in again.', 401)

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleExpiredJWTError()
    
    sendErrorProd(error, res);
  }
  next();
};
