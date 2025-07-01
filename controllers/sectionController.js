const asynchandler = require("express-async-handler");
const Section = require("./../models/sectionModel");
const AppError = require("./../utils/appError");
const Product = require("../models/productModel");
const APIFeatures = require("./../utils/apiFeatures");

const redisClient = require("./../redis");

exports.getAllSections = asynchandler(async (req, res) => {
  const filter = req.params.categoryId
    ? { category: req.params.categoryId }
    : {};

  let sections;
  // Check if section exists on redis.
  const sectionsCache = await redisClient.get(`sections:${filter?.category}`);

  if (sectionsCache) {
    sections = JSON.parse(sectionsCache);
  } else {
    const query = Section.find(filter).populate("category", "name");
    const features = new APIFeatures(query, req.query).paginate();
    sections = await features.query;

    await redisClient.setEx(
      `sections:${filter?.category}`,
      3600,
      JSON.stringify(sections)
    );
  }

  // const sections = await features.query;
  res.status(200).json({
    status: "success",
    results: sections.length,
    data: sections,
  });
});

exports.getSection = asynchandler(async (req, res) => {
  const section = await Section.findById(req.params.id).populate("products");
  // const docsCount = await Section.find().countDocuments();
  // console.log(section);
  if (!section) {
    return next(
      new AppError(`No section found with that ID: ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    status: "success",
    data: section,
    // totalDocs: docsCount
  });
});

exports.createSection = asynchandler(async (req, res) => {
  const newSection = await Section.create(req.body);
  res.status(201).json({
    status: "success",
    data: newSection,
  });
});

exports.updateSection = asynchandler(async (req, res) => {
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

exports.deleteSection = asynchandler(async (req, res, next) => {
  // Get all the products in this section
  const sec = await Section.findById(req.params.id).populate("products");
  if (!sec) {
    return next(new AppError(`No section with that ID: ${req.params.id}`, 404));
  }

  // Delete all products in it
  if (sec) {
    await Promise.all(
      sec.products.map(async (section) => {
        await Product.findByIdAndDelete(section._id);
      })
    );
  }

  await Section.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
