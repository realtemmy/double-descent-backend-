const express = require("express");
const orderController = require("./../controllers/orderController");
const authController = require("./../controllers/authController");
const paymentController = require("./../controllers/paymentController");

const router = express.Router();

router.route("/").get(authController.protect, orderController.getAllOrders);
router.route("/:id/confirm").patch(
  authController.protect,
  // authController.restrictToAdmin,
  orderController.confirmOrder
);

router
  .route("/user")
  .get(authController.protect, orderController.getAllUserOrder);

router.route("/:id").get(authController.protect, orderController.getOrder);
// .patch(authController.protect, orderController.confirmOrder);

router
  .route("/checkout")
  .post(authController.protect, orderController.getCheckoutSession);

router
  .route("/paystack-checkout")
  .post(authController.protect, paymentController.getPaystackCheckoutSession);

module.exports = router;
