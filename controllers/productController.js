const Product = require("./../models/productModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const cloudinary = require("./../utils/cloudinary");

exports.uploadProductImage = catchAsync(async (req, res, next) => {
  // Should i add width and height, would thay affect the quality of the images?
  const imagePath = "./dev-data/images/cosmetics.jpg";
  const result = await cloudinary.uploader.upload(imagePath, {
    folder: "products",
    // Omo the image gats be like 1200/1000
    // width: 300,
    // height: 250,
  });
  // console.log(result.secure_url);
  req.body.image = result.secure_url;
  next();
});

exports.getFeaturedProducts = catchAsync(async (req, res) => {
  const featuredProducts = await Product.find({ isFeatured: true });

  // console.log(featuredProducts);
  res.status(200).json({
    status: "success",
    results: featuredProducts.length,
    data: featuredProducts,
  });
});

// How to implement search
// const search = Product.find({
//   name: req.params.searchValue,
//   brand: req.params.searchValue,
// });
// Do this in both sections and categories...maybe id create a different middleware for search sha

exports.getAllProducts = catchAsync(async (req, res, next) => {
  // Pagination
  // localhost:5000/api/v1/products/:page(1)
  console.log(req.params);
  const limit = 10;
  const page = req.params.page * 1 || 1;
  const skip = (page - 1) * limit;
  console.log("page: ", page);
  console.log("skip: ", skip);

  let filter = {};
  // if (req.params.categoryId) filter = { category: req.params.categoryId };
  const products = await Product.find(filter).limit(limit).skip(skip);

  res.status(200).json({
    status: "success",
    results: products.length,
    data: products,
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
    data: product,
  });
});

exports.createProduct = catchAsync(async (req, res, next) => {
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
