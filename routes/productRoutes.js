const express = require("express");
const productController = require("./../controllers/productController");
const authController = require("./../controllers/authController");

const router = express.Router({ mergeParams: true });

// change restrictTo to restrictToAdmin

router
  .route("/")
  .get(productController.getAllProducts)
  .post(
    authController.protect,
    authController.restrictToAdmin,
    productController.createProduct
  );

router.route("/featured-products").get(productController.getFeaturedProducts);

router
  .route("/:id")
  .get(productController.getProduct)
  .patch(
    authController.protect,
    authController.restrictToAdmin,
    productController.updateProduct
  )
  .delete(
    authController.protect,
    authController.restrictToAdmin,
    productController.deleteProduct
  );

module.exports = router;
