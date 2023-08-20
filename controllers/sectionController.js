const Section = require("./../models/sectionModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const Product = require("../models/productModel");

exports.getAllSections = catchAsync(async (req, res) => {
  // Get all sections = getting all sections on a particular category if request is made to
  // the format:  /api/v1/category/:categoryId/section
  const filter = {};
  if (req.params.categoryId) filter = { category: req.params.categoryId };
  const sections = await Section.find(filter);
  res.status(200).json({
    status: "success",
    results: sections.length,
    data: sections,
  });
});

exports.getSection = catchAsync(async (req, res) => {
  const section = await Section.findById(req.params.id).populate("products");
  if (!section) {
    return next(
      new AppError(`No section found with that ID: ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    status: "success",
    data: section,
  });
});

exports.createSection = catchAsync(async (req, res) => {
  const newSection = await Section.create(req.body);
  res.status(201).json({
    status: "success",
    data: newSection,
  });
});

exports.updateSection = catchAsync(async (req, res) => {
  const updatedSection = await Section.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedSection) {
    return next(new AppError(`No section with that ID: ${req.params.id}`, 404));
  }

  res.status(200).json({
    status: "success",
    data: updatedSection,
  });
});

exports.deleteSection = catchAsync(async (req, res, next) => {
  // Get all the products in this section
  const sec = await Section.findById(req.params.id).populate("products");
  // Delete all products in it
  if (sec) {
    await Promise.all(
      sec.products.map(async (section) => {
        await Product.findByIdAndDelete(section._id);
      })
    );
  }

  const section = await Section.findByIdAndDelete(req.params.id);
  if (!section) {
    return next(new AppError(`No section with that ID: ${req.params.id}`, 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});