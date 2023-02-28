const mongoose = require("mongoose");

const Category = require("./../models/categoryModel");

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({
      status: "success",
      results: categories.length,
      data: { categories },
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      data: { error },
    });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    res.status(200).json({
      status: "success",
      data: { category },
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      data: { error },
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const newCategory = await Category.create(req.body);
    res.status(201).json({
      status: "success",
      data: { newCategory },
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      data: { error },
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    console.log(req.params.id);
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
  } catch (error) {
    res.status(404).json({
      status: "fail",
      data: { error },
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      data: { error },
    });
  }
};
