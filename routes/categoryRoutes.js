const express = require("express");
const categoryController = require("./../controllers/categoryController");
const authController = require('./../controllers/authController');

const router = express.Router();

router
  .route("/")
  .get(categoryController.getAllCategories)
  .post(authController.protect, authController.restrict, .createCategory);

router
  .route("/:id")
  .get(categoryController.getCategory)
  .patch(authController.protect, authController.restrict, categoryController.updateCategory)
  .delete(authController.protect, authController.restrict, categoryController.deleteCategory);

module.exports = router;
