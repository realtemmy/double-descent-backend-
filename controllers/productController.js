const multer = require("multer");
const Product = require("./../models/productModel");
const Section = require("./../models/sectionModel");
const Category = require("./../models/categoryModel");
const AppError = require("./../utils/appError");
const cloudinary = require("./../utils/cloudinary");
const APIFeatures = require("./../utils/apiFeatures");
const Pagination = require("./../utils/pagination");
const asyncHandler = require("express-async-handler");

const redisClient = require("./../redis");

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
  const { page, limit, category, section, search } = req.query;
  const { categoryId, sectionId } = req.params;

  let filter = {};
  let result = [];

  // Create unique cache key based on query and params
  const cacheKey = `products:${page || 1}:${limit || 10}:${
    (category ?? categoryId) || ""
  }:${(section ?? sectionId) || ""}:${search || ""}`;

  // Check if products exist in Redis cache
  const productsCache = await redisClient.get(cacheKey);
  if (productsCache) {
    // console.log("Serving products from Redis cache");
    const cachedData = JSON.parse(productsCache);
    return res.status(200).json(cachedData);
  }

  // Filter by category or section
  if (categoryId || category) {
    const categories = category
      ? category.split(",").map((id) => id.trim())
      : [categoryId];
    filter.category = { $in: categories };
  }

  if (sectionId || section) {
    filter.section = sectionId || section;
  }

  // Search logic
  if (
    search &&
    search !== "null" &&
    search !== "undefined" &&
    search.trim() !== ""
  ) {
    const searchRegex = new RegExp(search, "i");
    filter.$or = [{ name: searchRegex }, { brand: searchRegex }];

    const sections = await Section.find({
      name: { $regex: searchRegex },
    }).populate("products");
    sections.forEach((section) => {
      result.push(...section.products);
    });

    const categories = await Category.find({
      name: { $regex: searchRegex },
    }).populate("products");
    categories.forEach((category) => {
      result.push(...category.products);
    });
  }

  // Fetch products matching filters
  const totalItems = await Product.countDocuments(filter);
  const pagination = new Pagination(page, limit);
  const products = await pagination.apply(Product.find(filter));
  result.push(...products);

  // Remove duplicates by _id
  const uniqueResults = Array.from(
    new Set(result.map((item) => item._id.toString()))
  ).map((id) => result.find((item) => item._id.toString() === id));

  // Format response
  const formattedResponse = pagination.formatResponse(
    uniqueResults,
    totalItems
  );

  const responseData = {
    status: "success",
    results: uniqueResults.length,
    ...formattedResponse,
    data: uniqueResults,
  };

  // Cache the response data in Redis (stringified)
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));

  // console.log("From Mongodb database.");
  res.status(200).json(responseData);
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
  // Firstly check if proeuct exists in redis cache
  let product;
  const cachedProduct = await redisClient.get(`product:${req.params.id}`);
  if (cachedProduct) {
    product = JSON.parse(cachedProduct);
  } else {
    // If not in cache, fetch from database
    product = await Product.findById(req.params.id).populate(
      "category",
      "name"
    );
    if (product) {
      // Store the product in cache for future requests
      await redisClient.set(
        `product:${req.params.id}`,
        JSON.stringify(product)
      );
    }
  }
  // If product id not in cache or database, return error
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
  // Add to redis cache
  redisClient.set(`product:${newProduct._id}`, JSON.stringify(newProduct));
  res.status(201).json({
    status: "success",
    data: newProduct,
  });
});

exports.updateProduct = asyncHandler(async (req, res, next) => {
  // Maybe invalidate cache here or if there;s a way I can update the cache directly, do that
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
  // Invalidate cache
  await redisClient.del(`product:${req.params.id}`);
  res.status(204).json({
    status: "success",
    data: null,
  });
});
