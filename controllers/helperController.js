const Product = require("../models/productModel");
const Section = require("../models/sectionModel");
const Category = require("../models/categoryModel");
const Message = require("./../models/messageModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("./../utils/email");
const socketIO = require("./../app");

exports.getSearchResults = catchAsync(async (req, res) => {
  const searchValue = req.params.searchValue;

  let result = [];
  // 1) Check Products
  const products = await Product.find({
    name: { $regex: ".*" + searchValue + ".*" },
  });

  const prodBrand = await Product.find({
    brand: { $regex: ".*" + searchValue + ".*" },
  });

  result.push(...products, ...prodBrand);
  // 2) Check Sections
  let sections = await Section.find({
    name: { $regex: ".*" + searchValue + ".*" },
  }).populate("products");
  sections.forEach((sec) => {
    const val = sec.products;
    result.push(...val);
  });
  // 3) Check Category
  let category = await Category.find({
    name: { $regex: ".*" + searchValue + ".*" },
  }).populate("products");

  category.forEach((cat) => {
    let val = cat.products;
    result.push(...val);
  });

  res.status(200).json({
    status: "success",
    data: result,
  });
});

// Send emails to customers
exports.sendEmails = catchAsync(async (req, res, next) => {
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

exports.userComplaintsMessages = catchAsync(async (req, res) => {
  // Get the message, the user that sent the message etc
  // or should I just make it send directly to emails?
  const { message } = req.body;
  console.log(req.user);
  const userMessage = Message.create({
    user: req.user.id,
    email: req.user.email,
    message,
  });

  socketIO.on("connection", (socket) => {
    socket.emit("message", "successsful");
  });

  socketIO.emit("message", userMessage);
  res.status(201).json({
    status: "success",
    data: userMessage,
  });
});
