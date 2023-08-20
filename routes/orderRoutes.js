const express = require("express");
const orderController = require("./../controllers/orderController");
const authController = require("./../controllers/authController");

const router = express.Router();

router
  .route("/")
  .get(authController.protect,  orderController.getAllUserOrder)
  .post(authController.protect, orderController.createOrder);

module.exports = router