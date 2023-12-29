const express = require("express");
const categoryController = require("./../controllers/categoryController");
const authController = require("./../controllers/authController");
const sectionRouter = require('./../routes/sectionRoutes');
const productRouter = require("./../routes/productRoutes");

// category/section/products
// provision/cereals/cornflakes

const router = express.Router();

router.use("/:categoryId/section", sectionRouter);
router.use("/:categoryId/product", productRouter);
router.use("/section/:sectionId/product", productRouter);

router
  .route("/")
  .get(categoryController.getAllCategories)
  .post(
    authController.protect,
    authController.restrictToAdmin,
    categoryController.uploadCategoryPhoto,
    categoryController.uploadCategoryImage,
    categoryController.createCategory
  );

router
  .route("/:id")
  .get(categoryController.getCategory)
  .patch(
    authController.protect,
    authController.restrictToAdmin,
    categoryController.uploadCategoryImage,
    categoryController.updateCategory
  )
  .delete(
    authController.protect,
    authController.restrictToAdmin,
    categoryController.deleteCategory
  );

module.exports = router;
