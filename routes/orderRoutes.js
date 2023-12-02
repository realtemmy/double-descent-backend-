const express = require("express");
const orderController = require("./../controllers/orderController");
const authController = require("./../controllers/authController");

const router = express.Router();

router.route("/").get(authController.protect, orderController.getAllOrders);

router
  .route("/user")
  .get(authController.protect, orderController.getAllUserOrder);

router
  .route("/user/:id")
  .get(orderController.getOrder)
  .patch(authController.protect, orderController.confirmOrder);

router
  .route("/checkout")
  .post(authController.protect, orderController.getCheckoutSession);

module.exports = router;
