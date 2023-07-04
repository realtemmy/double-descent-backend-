const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: [true, "a product must have a name"],
  },
  price: {
    type: Number,
    required: [true, "a product must have a price"],
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  description: {
    type: String,
    required: [true, "a product must have description"],
  },
  section: {
    type: mongoose.Schema.ObjectId,
    ref:"Section",
    required:[true, "a product must belong to a section"]
  }
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
