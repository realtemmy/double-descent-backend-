const stripe = require("stripe")(
  "sk_test_51LsCPvGIPXZEyyN0PgYbiIPhS1S8a8zUO7SQrueZ6iBaC85607HMxa3g20e4GOqeIWhfVQEEuawcC13xW9QZG07x00iISqD203"
);
const catchAsync = require("../utils/catchAsync");
const Order = require("./../models/orderModel");
// import sendEmail from "../utils/email";
const sendMail = require("./../utils/email");

console.log(process.env.STRIPE_SECRET_KEY);

exports.getAllUserOrder = async (req, res) => {
  const orders = await Order.findById(req.user.id);
  res.status(200).json({
    status: "success",
    data: orders,
  });
};

const calculateTotalAmount = (items, deliveryFee) => {
  let amount = 0;
  items.forEach((item) => {
    amount += item.quantity * item.price;
  });
  amount += deliveryFee;
  return amount;
};

const getEachOrderProductDetails = (items) => {
  const product = items.map((product) => {
    const { name, quantity, image, price } = product;
    return { name, quantity, image, price, quantity };
  });
  console.log(product);
  return product;
};

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const { address, phone, cartItems, deliveryFee } = req.body;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: req.user.email,
    client_reference_id: req.user.id,
    line_items: getEachOrderProductDetails(cartItems),
    mode: "payment",
    currency: "NGN",
    success_url: "http://localhost:5000?success=true",
    cancel_url: "http://localhost:5000/cart?canceled=true",
  });
});

exports.createOrder = async (req, res, next) => {
  const { address, phone, cartItems, deliveryFee } = req.body;

  const totalAmount = calculateTotalAmount(cartItems, deliveryFee);
  const products = getEachProductAndQuantity(cartItems);
  console.log(products, req.user);

  const newOrder = await Order.create({
    userId: req.user.id,
    address,
    phone,
    totalAmount,
    products,
  });

  res.status(201).json({
    status: "success",
    body: newOrder,
  });
};

// Creating of order would be immediately after stripe payment is successful
// The totalAmount would be calculated before it saves in the db from the incoming items
// The product and quantity would also come from the array of items
// user_id, address and phone number would be from the logged in user or
// anyone that's inputted on the frontend sha

// And paymentId if stripe gives one
