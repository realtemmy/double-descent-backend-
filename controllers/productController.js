const multer = require("multer");
const Product = require("./../models/productModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const cloudinary = require("./../utils/cloudinary");
const APIFeatures = require("./../utils/apiFeatures");
const Pagination = require("./../utils/pagination");

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

exports.uploadProductImage = catchAsync(async (req, res, next) => {
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

exports.getFeaturedProducts = catchAsync(async (req, res) => {
  const featuredProducts = await Product.find({ isFeatured: true });
  res.status(200).json({
    status: "success",
    results: featuredProducts.length,
    data: featuredProducts,
  });
});

exports.getAllProducts = catchAsync(async (req, res) => {
  let filter = {};
  if (req.params.categoryId) filter = { category: req.params.categoryId };
  if (req.params.sectionId) filter = { section: req.params.sectionId };
  // const totalDocs = await Product.find(filter).countDocuments();
  // const features = new APIFeatures(Product.find(filter), req.query).paginate();
  // const products = await features.query;
  // res.status(200).json({
  //   status: "success",
  //   results: products.length,
  //   data: products,
  //   totalDocs,
  // });
  const { page, limit } = req.query;
  const pagination = new Pagination(page, limit);
  const totalItems = await Product.countDocuments(filter);
  const products = await pagination.apply(Product.find(filter));
  const response = pagination.formatResponse(products, totalItems);
  res.status(200).json({
    status: "success",
    ...response,
  });
});

exports.getProduct = catchAsync(async (req, res, next) => {
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

exports.createProduct = catchAsync(async (req, res) => {
  if (!req.body.category) req.body.category = req.params.categoryId;
  const newProduct = await Product.create(req.body);
  res.status(201).json({
    status: "success",
    data: newProduct,
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
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

exports.deleteProduct = catchAsync(async (req, res, next) => {
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
