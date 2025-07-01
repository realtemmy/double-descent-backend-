const asynchandler = require("express-async-handler")
const multer = require("multer");
const cloudinary = require("./../utils/cloudinary");
const Category = require("./../models/categoryModel");
const Section = require("./../models/sectionModel");
const Product = require("./../models/productModel");
const AppError = require("./../utils/appError");
const Pagination = require("./../utils/pagination");

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

exports.confirmCategoryImage = (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No file uploaded", 400));
  }
  next();
};

exports.uploadCategoryImage = asynchandler(async (req, res, next) => {
  if (!req.file) return next();
  const b64 = Buffer.from(req.file.buffer).toString("base64");
  let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
  const result = await cloudinary.uploader.upload(dataURI, {
    folder: "category",
    width: 1000,
    height: 1200,
  });
  req.body.image = result.secure_url;
  next();
});

exports.getAllCategories = asynchandler(async (req, res) => {
  let filter = {};
  if (req.query.name) filter = { name: req.query.name };
  const categories = await Category.find();
  res.status(200).json({
    status: "success",
    results: categories.length,
    data: categories,
  });
});

exports.getCategory = asynchandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate("sections")
    .populate("products");

  res.status(200).json({
    status: "success",
    data: category,
  });
});

exports.createCategory = asynchandler(async (req, res) => {
  const newCategory = await Category.create(req.body);
  res.status(201).json({
    status: "success",
    data: newCategory,
  });
});

exports.updateCategory = asynchandler(async (req, res, next) => {
  const { name, image } = req.body;
  const updateData = {};
  if (name) updateData.name = name;
  if (image !== null && image !== undefined && image !== "null")
    updateData.image = image;

  if (!name && !image) {
    return next(new AppError("No data to update", 400));
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).json({
    status: "success",
    data: updatedCategory,
  });
});

// Get the image public_id from image url(cloudinary)
const getPublicIdFromImageUrl = (imageUrl) => {
  const urlParts = imageUrl.split("/");
  const filename = urlParts[urlParts.length - 1];
  const publicId = filename.split(".")[0];
  return publicId;
};

exports.deleteCategory = asynchandler(async (req, res, next) => {
  const cat = await Category.findById(req.params.id)
    .populate("sections")
    .populate("products");

  if (!cat) {
    return next(
      new AppError(`No category found with that ID: ${req.params.id}`, 404)
    );
  }

  // Get image public_id if there is an image
  const public_id = cat.image ? getPublicIdFromImageUrl(cat.image) : null;
  if (public_id) {
    await cloudinary.uploader.destroy(public_id);
  }

  // Delete sections
  if (Array.isArray(cat.sections)) {
    await Section.deleteMany({ _id: { $in: cat.sections.map((s) => s._id) } });
  }

  // Delete products and their images
  if (Array.isArray(cat.products)) {
    await Promise.all(
      cat.products.map(async (product) => {
        const productPublicId = product.image
          ? getPublicIdFromImageUrl(product.image)
          : null;

        if (productPublicId) {
          await cloudinary.uploader.destroy(productPublicId);
        }

        await Product.findByIdAndDelete(product._id);
      })
    );
  }

  // Delete the category from the database
  await Category.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
