const express = require("express");
const authController = require("./../controllers/authController");
const paymentController = require("./../controllers/paymentController");

const router = express.Router();

router.route("/").post(paymentController.createPaymentIntent);

module.exports = router;
