const Product = require("./../models/productModel");
const Section = require("./../models/sectionModel");
const Category = require("./../models/categoryModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

exports.getSearchResults = catchAsync(async (req, res) => {
  const searchValue = req.params.searchValue;
  // console.log(searchValue);
  let result = [];
  // 1) Check Products
  const products = await Product.find({
    name: { $regex: ".*" + searchValue + ".*" },
    brand: { $regex: ".*" + searchValue + ".*" },
  });
  result.push(...products);
  // 2) Check Sections
  let sections = await Section.find({
    name: { $regex: ".*" + searchValue + ".*" },
  }).populate("products");
  sections.forEach((sec) => {
    const val = sec.products;
    result.push(...val)
  });
  // 3) Check Category
  let category = await Category.find({
    name: { $regex: ".*" + searchValue + ".*" },
  }).populate("products");

  category.forEach((cat) => {
    let val = cat.products
    result.push(...val)
  });

  // console.log(result);
  res.status(200).json({
    status: "success",
    data: result,
  });
});
