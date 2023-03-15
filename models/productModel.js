const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: [true, "a product must have a name"],
  },
  price: {
    type: Number,
    required: [true, "a product must have a price"],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "a product must belong to a category"],
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  brand: {
    type: String,
    required: [true, "a product must have a brand"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
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
