const mongoose = require("mongoose");
const { findOne } = require("../models/userModel");

const Product = require("./../models/productModel");

exports.getFeaturedProducts = async (req, res) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true });

    console.log(featuredProducts);
    res.status(200).json({
      status: "success",
      data: { featuredProducts },
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      data: { error },
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    // Filtering
    const queryObj = { ...req.query };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte||lt)\b/g,
      (match) => `$${match}`
    );

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
  } catch (error) {
    res.status(404).json({
      status: "fail",
      data: { error },
    });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    res.status(200).json({
      status: "success",
      data: { product },
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      data: { error },
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    res.status(201).json({
      status: "success",
      data: { newProduct },
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      data: { error },
    });
  }
};

exports.updateProduct = async (req, res) => {
  // const queryFields = req.query
  try {
    // const updateProduct = await Product.findByIdAndUpdate(req.body.id);

    const updateProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: "success",
      data: { updateProduct },
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      data: { error },
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
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
