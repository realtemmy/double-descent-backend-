const Product = require("./../models/productModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

exports.getFeaturedProducts = catchAsync(async (req, res, next) => {
  const featuredProducts = await Product.find({ isFeatured: true });

  console.log(featuredProducts);
  res.status(200).json({
    status: "success",
    data: { featuredProducts },
  });
});

exports.getAllProducts = catchAsync(async (req, res, next) => {
  // Filtering
  const queryObj = { ...req.query };
  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((el) => delete queryObj[el]);

  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte||lt)\b/g, (match) => `$${match}`);

  let query = Product.find(JSON.parse(queryStr));

  // Limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    query = query.select(fields);
  } else {
    query = query.select("-__v");
  }

  // Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 20;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  if (req.query.page) {
    const numProduct = await Product.countDocuments();
    if (skip >= numProduct) throw new Error("This page does not exist");
  }

  const products = await query;

  res.status(200).json({
    status: "success",
    results: products.length,
    data: { products },
  });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate("category");
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
