const stripe = require("stripe")(
  "sk_test_51LsCPvGIPXZEyyN0PgYbiIPhS1S8a8zUO7SQrueZ6iBaC85607HMxa3g20e4GOqeIWhfVQEEuawcC13xW9QZG07x00iISqD203"
);
const { checkout } = require("../app");
const catchAsync = require("../utils/catchAsync");
const Order = require("./../models/orderModel");
// import sendEmail from "../utils/email";
const sendMail = require("./../utils/email");

exports.getAllUserOrder = async (req, res) => {
  const orders = await Order.findById(req.user.id);
  res.status(200).json({
    status: "success",
    data: orders,
  });
};

exports.handleOrderCheckOut = catchAsync(async (checkoutSession) => {

  const stripeRes = await stripe.customers.retrieve(checkoutSession.customer);
  
  const session = await stripe.checkout.sessions.retrieve(checkoutSession.id, {
    expand: ["line_items"],
  });

  // Get product Id's from the sessions
  const productsIds = session.line_items.data.map((item) => item.price.product);
  // Get all products with productId
  const products = await Promise.all(
    productsIds.map(async (id) => await stripe.products.retrieve(id))
  );
  // create order product
  await Order.create({
    userId: stripeRes.metadata.userId,
    customerId: stripeRes.id,
    address: stripeRes.metadata.address,
    phone: stripeRes.metadata.phone,
    totalAmount: session.amount_total / 100,
    products: products.map((product, idx) => ({
      name: product.name,
      productId: product.id,
      image: product.images[0],
      quantity: session.line_items.data[idx].quantity,
      price: session.line_items.data[idx].price.unit_amount / 100,
    })),
  });
});

exports.getCheckoutSession = catchAsync(async (req, res) => {
  const { address, phone, cartItems, deliveryFee } = req.body;
  // Create customer
  const customer = await stripe.customers.create({
    metadata: {
      userId: req.user.id,
      deliveryFee,
      phone,
      address,
    },
    email: req.user.email,
    name: req.user.name,
    phone,
  });

  const transformedItems = cartItems.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: "NGN",
      unit_amount: item.price * 100,
      product_data: {
        name: item.name,
        images: [item.image],
      },
    },
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    client_reference_id: req.user.id,
    line_items: transformedItems,
    mode: "payment",
    currency: "NGN",
    customer: customer.id,
    success_url: "http://localhost:3000",
    cancel_url: "http://localhost:3000/cart",
  });

  res.status(200).json({
    status: "success",
    url: session.url,
  });
});
