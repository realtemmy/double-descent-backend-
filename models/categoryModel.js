const slugify = require("slugify");
const mongoose = require("mongoose");

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
    createdAt: {
      type: Date,
      default: Date.now(),
    }
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

categorySchema.virtual("products", {
  ref: "Product",
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
