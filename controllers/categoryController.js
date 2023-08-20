const cloudinary = require("./../utils/cloudinary");
const catchAsync = require("./../utils/catchAsync");
const Category = require("./../models/categoryModel");
const AppError = require("./../utils/appError");

// REmember to refactor this uploading of images to a single function in utils/cloudinary
exports.uploadCategoryImage = catchAsync(async (req, res, next) => {
  const imagePath = "./dev-data/images/weave-on.jpg";
  const result = await cloudinary.uploader.upload(imagePath, {
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
  const cat = await Category.findById(req.params.id);
  // Get image public_id
  const public_id = getPublicIdFromImageUrl(cat.image);
  // Delete image at cloudinary
  await cloudinary.uploader.destroy(public_id);
  // Delete category from database
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    return next(
      new AppError(`No category found with that ID: ${req.params.id}`, 404)
    );
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});
