/* eslint-disable import/no-useless-path-segments */
const multer = require("multer");
const catchAsync = require("./../utils/catchAsync");
const User = require("./../models/userModel");
const AppError = require("./../utils/appError");
const cloudinary = require("./../utils/cloudinary");
const Email = require("./../utils/email");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single("photo");

exports.uploadUserToCloudinary = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError("No file uploaded", 400));
  const b64 = Buffer.from(req.file.buffer).toString("base64");
  let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
  const cldRes = await cloudinary.uploader.upload(dataURI, {
    folder: "user",
    width: 400,
    height: 400,
  });
  req.body.photo = cldRes.secure_url;
  const updatedUserImage = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    data: updatedUserImage,
  });
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    results: users.length,
    data: { users },
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  const currentUser = await User.findById(req.user.id);
  res.status(200).json({
    status: "success",
    data: {
      user: currentUser,
    },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: { user },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError(
        "This route is not for password update. Please use /updatePassword",
        400
      )
    );
  }

  const filteredBody = filterObj(req.body, "name", "email", "phone", "address");
  filteredBody.phone = parseInt(filteredBody.phone)
  if (req.body.phone === NaN) {
    req.body.phone === undefined;
    return next(new AppError(`Please enter numbers in phone number input`)); //work on the english
  }
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.sendUserMails = catchAsync(async (req, res, next) => {
  const { emails, subject, message } = req.body;
  // Send email to a list of users

  try {
    const email = new Email();
    email.to = emails;
    await email.send(subject, message);

    res.status(200).json({
      status: "success",
      message: "Email sent",
    });
  } catch (error) {
    console.log(error);

    return next(
      new AppError(
        "There was an error sending the email. Please try again later!"
      )
    );
  }
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
