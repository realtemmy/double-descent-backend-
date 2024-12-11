const Product = require("../models/productModel");
const Section = require("../models/sectionModel");
const Category = require("../models/categoryModel");
const Message = require("./../models/messageModel");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");
const sendEmail = require("./../utils/email");
const socketIO = require("./../app");

exports.getSearchResults = asyncHandler(async (req, res) => {
  const searchValue = req.params.searchValue;

  // Define a common regex for matching
  const searchRegex = new RegExp(searchValue, "i");

  let result = [];

  // 1) Search Products by Name or Brand
  const products = await Product.find({
    $or: [
      { name: { $regex: searchRegex } },
      { brand: { $regex: searchRegex } },
    ],
  });

  result.push(...products);

  // 2) Check Sections
  const sections = await Section.find({
    name: { $regex: searchRegex },
  }).populate("products");
  sections.forEach((section) => {
    result.push(...section.products);
  });

  // 3) Check Categories
  const categories = await Category.find({
    name: { $regex: searchRegex },
  }).populate("products");
  categories.forEach((category) => {
    result.push(...category.products);
  });

  // Remove duplicates by creating a Set from the result array
  const uniqueResults = Array.from(new Set(result.map((item) => item._id))).map(
    (id) => result.find((item) => item._id.equals(id))
  );

  // Respond with the results
  res.status(200).json({
    status: "success",
    results: uniqueResults.length,
    data: uniqueResults,
  });
});

// Send emails to customers
exports.sendEmails = asyncHandler(async (req, res, next) => {
  // get user to send the email to
  const { html, users, title } = req.body;
  // html is the design while users will be an array of emails to send to
  // email, subject, html
  if (!html || !title) {
    return next(new AppError("Please input all required info", 400));
  }
  try {
    await sendEmail({
      email: ["temmy4jamb@gmail.com"],
      subject: title,
      html,
    });

    res.status(200).json({
      status: "success",
      message: "Successfully sent email to users",
    });
  } catch (error) {
    return next(new AppError("There was an error sending email to users", 500));
  }
});

exports.userComplaintsMessages = asyncHandler(async (req, res) => {
  const { message } = req.body;
  // console.log(req.user);
  const userMessage = await Message.create({
    user: req.user._id,
    email: req.user.email,
    message,
  });

  // console.log(userMessage);

  // socketIO.on("connection", (socket) => {
  //   socket.emit("message", "successful");
  // });

  // socketIO.emit("message", userMessage);
  res.status(201).json({
    status: "success",
    data: userMessage,
  });
});
