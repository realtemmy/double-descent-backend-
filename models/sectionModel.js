const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "Name for section is required"],
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: [true, "Section must belong to a category"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

sectionSchema.virtual("products", {
  ref: "Product",
  foreignField: "section",
  localField: "_id",
});

const Section = mongoose.model("Section", sectionSchema);

module.exports = Section;
