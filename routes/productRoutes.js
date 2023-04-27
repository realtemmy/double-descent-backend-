const express = require("express");
const productController = require("./../controllers/productController");
const authController = require("./../controllers/authController");

const router = express.Router();

// change restrictTo to restrictToAdmin

router
  .route("/")
  .get(productController.getAllProducts)
  .post(authController.protect, authController.restrict, productController.createProduct);

router.route("/featured-products").get(productController.getFeaturedProducts);

router
  .route("/:id")
  .get(productController.getProduct)
  .patch(authController.protect, authController.restrict, productController.updateProduct)
  .delete(
    authController.protect,
    authController.restrict,
    productController.deleteProduct
  );

module.exports = router;
