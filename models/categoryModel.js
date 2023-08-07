const slugify = require("slugify");
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
    slug: String,
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

categorySchema.pre("save", function (next) {
  this.slug = slugify(this.name, {
    lower: true,
  });
  next()
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
