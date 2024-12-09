const multer = require("multer");
const Product = require("./../models/productModel");
const Section = require("./../models/sectionModel");
const Category = require("./../models/categoryModel");
const AppError = require("./../utils/appError");
const cloudinary = require("./../utils/cloudinary");
const APIFeatures = require("./../utils/apiFeatures");
const Pagination = require("./../utils/pagination");
const asyncHandler = require("express-async-handler");

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

exports.uploadProductPhoto = upload.single("image");

exports.confirmProductImage = (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No file uploaded", 400));
  }
  next();
};

exports.uploadProductImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const b64 = Buffer.from(req.file.buffer).toString("base64");
  let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
  const result = await cloudinary.uploader.upload(dataURI, {
    folder: "products",
    // Omo the image gats be like 1200/1000
    width: 1000,
    height: 1200,
  });
  req.body.image = result.secure_url;
  next();
});

exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const featuredProducts = await Product.find({ isFeatured: true });
  res.status(200).json({
    status: "success",
    results: featuredProducts.length,
    data: featuredProducts,
  });
});

exports.getAllProducts = asyncHandler(async (req, res) => {
  // console.log(req.query);
  // category: "656767dedb64b6362e80f90d,65676843db64b6362e80f916,673f0c1550162a836afcca67";
  let filter = {};
  if (req.params.categoryId) {
    filter.category = req.params.categoryId;
  } else if (req.query.category) {
    const categories = req.query.category.split(",").map((id) => id.trim());
    filter.category = { $in: categories }; // Match any category in the list
  }

  if (req.params.sectionId) {
    filter.section = req.params.sectionId;
  } else if (req.query.section) {
    filter.section = req.query.section;
  }

  const { page, limit } = req.query;
  const pagination = new Pagination(page, limit);
  const totalItems = await Product.countDocuments(filter);
  const products = await pagination.apply(Product.find(filter));
  const response = pagination.formatResponse(products, totalItems);

  // console.log(response);

  res.status(200).json({
    status: "success",
    ...response,
  });
});

exports.getProductsByCategoryName = asyncHandler(async (req, res) => {
  const category = await Category.find({
    slug: req.params.categoryName,
  });

  const { page, limit } = req.query;
  const pagination = new Pagination(page, limit);
  const totalItems = await Product.countDocuments({
    category: category[0]._id,
  });
  const products = await pagination.apply(
    Product.find({ category: category[0]._id })
  );
  const response = pagination.formatResponse(products, totalItems);

  res.status(200).json({
    status: "success",
    ...response,
  });
});

exports.getProductsBySectionName = asyncHandler(async (req, res) => {
  const section = await Section.find({
    slug: req.params.sectionName,
  });

  const { page, limit } = req.query;
  const pagination = new Pagination(page, limit);
  const totalItems = await Product.countDocuments({
    section: section[0]._id,
  });
  const products = await pagination.apply(
    Product.find({ section: section[0]._id })
  );
  const response = pagination.formatResponse(products, totalItems);

  // console.log(response);

  res.status(200).json({
    status: "success",
    ...response,
  });
});

exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate(
    "category",
    "name"
  );
  if (!product) {
    return next(
      new AppError(`No product found with that ID: ${req.params.id}`, 404)
    );
  }
  res.status(200).json({
    status: "success",
    data: product,
  });
});

exports.createProduct = asyncHandler(async (req, res) => {
  if (!req.body.category) req.body.category = req.params.categoryId;
  const newProduct = await Product.create(req.body);
  res.status(201).json({
    status: "success",
    data: newProduct,
  });
});

exports.updateProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return next(
      new AppError(`No product found with that ID: ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    status: "success",
    data: product,
  });
});

// Get the public_id from the image url
const getPublicIdFromImageUrl = (imageUrl) => {
  const urlParts = imageUrl.split("/");
  const filename = urlParts[urlParts.length - 1];
  const publicId = filename.split(".")[0];
  return publicId;
};

exports.deleteProduct = asyncHandler(async (req, res, next) => {
  // find the product to be deleted
  const prod = await Product.findById(req.params.id);
  const public_id = getPublicIdFromImageUrl(prod.image);
  // Delete product from cloudinary
  await cloudinary.uploader.destroy(public_id);
  // Delete product from database
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return next(
      new AppError(`No product found with that ID: ${req.params.id}`, 404)
    );
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});
