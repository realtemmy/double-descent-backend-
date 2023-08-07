const mongoose = require("mongoose");
const { default: slugify } = require("slugify");

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
    slug: String
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

sectionSchema.pre("save", function (next) {
  this.slug = slugify(this.name, {
    lower: true,
  });
  next();
});


const Section = mongoose.model("Section", sectionSchema);

module.exports = Section;
