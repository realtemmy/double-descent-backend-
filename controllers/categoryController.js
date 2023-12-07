const multer = require("multer");
const cloudinary = require("./../utils/cloudinary");
const catchAsync = require("./../utils/catchAsync");
const Category = require("./../models/categoryModel");
const Section = require("./../models/sectionModel");
const Product = require("./../models/productModel");
const AppError = require("./../utils/appError");

// REmember to refactor this uploading of images to a single function in utils/cloudinary

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

exports.uploadCategoryPhoto = upload.single("image");

exports.uploadCategoryImage = catchAsync(async (req, res, next) => {
  console.log("File", req.file);
  console.log("Body: ", req.body);
  if (!req.file) {
    return next(new AppError("No file uploaded", 400));
  }
  const b64 = Buffer.from(req.file.buffer).toString("base64");
  let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
  const result = await cloudinary.uploader.upload(dataURI, {
    folder: "category",
    width: 100,
    height: 100,
  });
  req.body.image = result.secure_url;
  next();
});

exports.getAllCategories = catchAsync(async (req, res) => {
  const categories = await Category.find();
  res.status(200).json({
    status: "success",
    results: categories.length,
    data: categories,
  });
});

exports.getCategory = catchAsync(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate("sections")
    .populate("products");

  res.status(200).json({
    status: "success",
    data: category,
  });
});

exports.createCategory = catchAsync(async (req, res) => {
  const newCategory = await Category.create(req.body);
  res.status(201).json({
    status: "success",
    data: newCategory,
  });
});

exports.updateCategory = catchAsync(async (req, res) => {
  const updatedCategory = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(201).json({
    status: "success",
    data: { updatedCategory },
  });
});

// Get the image public_id from image url(cloudinary)
const getPublicIdFromImageUrl = (imageUrl) => {
  const urlParts = imageUrl.split("/");
  const filename = urlParts[urlParts.length - 1];
  const publicId = filename.split(".")[0];
  return publicId;
};

exports.deleteCategory = catchAsync(async (req, res, next) => {
  // Get category to be deleted
  // console.log("getting here");

  const cat = await Category.findById(req.params.id)
    .populate("sections")
    .populate("products");
  if (!cat) {
    return next(
      new AppError(`No category found with that ID: ${req.params.id}`, 404)
    );
  }
  // Get image public_id
  const public_id = getPublicIdFromImageUrl(cat.image);
  // Delete image at cloudinary
  await cloudinary.uploader.destroy(public_id);

  // Delete sections
  await Promise.all(
    cat.sections.map(async (category) => {
      await Section.findByIdAndDelete(category._id);
    })
  );
  // Delete products
  await Promise.all(
    cat.products.map(async (category) => {
      await Product.findByIdAndDelete(category._id);
    })
  );
  // Delete category from database
  await Category.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
