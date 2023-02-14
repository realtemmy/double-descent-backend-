const mongoose = require("mongoose");

const Product = require("./../models/productModel");

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
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
    const product = await Product.findById(req.params.id);
    res.status.json({
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
    const newProduct = Product.create(req.body);
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
