/* eslint-disable import/no-useless-path-segments */
const multer = require("multer");
const sharp = require("sharp");
const catchAsync = require("./../utils/catchAsync");
const User = require("./../models/userModel");
const AppError = require("./../utils/appError");

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

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
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
  console.log(req.params.id);
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

  const filteredBody = filterObj(req.body, "name", "email", "phone");
  req.body.phone = parseInt(req.body.phone);
  if(req.body.phone === NaN){
    req.body.phone === undefined;
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
