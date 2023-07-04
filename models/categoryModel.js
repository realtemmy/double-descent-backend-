const mongoose = require("mongoose");
const Section = require("./sectionModel");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "a category must have a name"],
      unique: true,
    },
    image: {
      type: String,
      required: [true, "a category must have an image"],
    },
    description: String,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

categorySchema.virtual("sections", {
  ref: "Section",
  foreignField: "category",
  localField: "_id",
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
