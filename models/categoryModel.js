const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "a category must have a name"],
    unique: true,
  },
  image: {
    type: String,
    required: [true, "a category must have an image"],
  },
  section: {
    type: String,
    required: [true, "Category must belong to a section"],
  },
  description: String,
});

// Virtual populate
categorySchema.virtual("products", {
  ref: "Product",
  foreignField: "category",
  localField: "_id",
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
