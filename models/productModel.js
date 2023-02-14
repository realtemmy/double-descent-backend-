const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "a product must have a name"],
  },
  price: {
    type: Number,
    required: [true, "a product must have a price"],
  },
  description: {
    type: String,
    required: [true, "a product must have description"],
  },
  summary: String,
  images: [String],
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
