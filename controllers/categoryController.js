const mongoose = require("mongoose");
const catchAsync = require("./../utils/catchAsync");

const Category = require("./../models/categoryModel");

exports.getAllCategories = catchAsync(async (req, res) => {
  const categories = await Category.find();
  res.status(200).json({
    status: "success",
    results: categories.length,
    data: { categories },
  });
});

exports.getCategory = catchAsync(async (req, res) => {
  const category = await Category.findById(req.params.id).populate('sections');
  res.status(200).json({
    status: "success",
    data: { category },
  });
});

exports.createCategory = catchAsync(async (req, res) => {
  const newCategory = await Category.create(req.body);
  res.status(201).json({
    status: "success",
    data: { newCategory },
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

exports.deleteCategory = catchAsync(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.status(204).json({
    status: "success",
    data: null,
  });
});
