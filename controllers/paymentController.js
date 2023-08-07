require("dotenv").config();
const stripe = require("stripe")(
  "sk_test_51LsCPvGIPXZEyyN0PgYbiIPhS1S8a8zUO7SQrueZ6iBaC85607HMxa3g20e4GOqeIWhfVQEEuawcC13xW9QZG07x00iISqD203"
);
const catchAsync = require("./../utils/catchAsync");

const calculateTotalAmount = (items, deliveryFee) => {
  let amount = 0;
  items.forEach((item) => {
    amount += item.quantity * item.price;
  });
  amount += deliveryFee;
  return amount;
};

exports.createPaymentIntent = catchAsync(async (req, res) => {
  const { cartItems, deliveryFee, address, phone, email, user_id } = req.body;
  // Reveives the whole item as an array, the user_id,
  // name, email address, and delivery fee
  // create a function for calculating totalAmount
  // console.log(req);
  console.log("line 22:", calculateTotalAmount(cartItems, deliveryFee) * 100);
  // const { totalAmount } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateTotalAmount(cartItems, deliveryFee),
    currency: "NGN",
    payment_method_types: ["card"],
    customer: user_id,
    receipt_email: email,
  });
  // console.log(paymentIntent.client_secret);

  res.status(200).json({
    status: "success",
    clientSecret: paymentIntent.client_secret,
  });
});
