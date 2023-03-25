const express = require("express");
const productController = require("./../controllers/productController");
const authController = require("./../controllers/authController");

const router = express.Router();

router
  .route("/")
  .get(authController.protect, productController.getAllProducts)
  .post(productController.createProduct);

router.route("/featured-products").get(productController.getFeaturedProducts);

router
  .route("/:id")
  .get(productController.getProduct)
  .patch(productController.updateProduct)
  .delete(
    authController.protect,
    authController.restrict,
    productController.deleteProduct
  );

module.exports = router;
