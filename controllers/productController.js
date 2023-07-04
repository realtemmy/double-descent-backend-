const Product = require("./../models/productModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

exports.getFeaturedProducts = catchAsync(async (req, res) => {
  const featuredProducts = await Product.find({ isFeatured: true });

  console.log(featuredProducts);
  res.status(200).json({
    status: "success",
    data: { featuredProducts },
  });
});

exports.getAllProducts = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.categoryId) filter = { category: req.params.categoryId };
  const products = await Product.find(filter);

  res.status(200).json({
    status: "success",
    results: products.length,
    data: { products },
  });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(
      new AppError(`No product found with that ID: ${req.params.id}`, 404)
    );
  }
  res.status(200).json({
    status: "success",
    data: { product },
  });
});

exports.createProduct = catchAsync(async (req, res, next) => {
  if (!req.body.category) req.body.category = req.params.categoryId;
  const newProduct = await Product.create(req.body);
  res.status(201).json({
    status: "success",
    data: { newProduct },
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
    data: { product },
  });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
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
