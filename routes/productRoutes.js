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
    productController.uploadProductPhoto,
    productController.confirmProductImage,
    productController.uploadProductImage,
    productController.createProduct
  );

router.route("/page").get(productController.getAllProducts);

router.route("/featured-products").get(productController.getFeaturedProducts);
router.route("/category/:categoryName").get(productController.getProductsByCategoryName);
router.route("/section/:sectionName").get(productController.getProductsBySectionName);

router
  .route("/:id")
  .get(productController.getProduct)
  .patch(
    authController.protect,
    authController.restrictToAdmin,
    // productController.uploadProductPhoto,
    productController.uploadProductImage,
    productController.updateProduct
  )
  .delete(
    authController.protect,
    authController.restrictToAdmin,
    productController.deleteProduct
  );

module.exports = router;
