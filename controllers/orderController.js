const stripe = require("stripe")(
  "sk_test_51LsCPvGIPXZEyyN0PgYbiIPhS1S8a8zUO7SQrueZ6iBaC85607HMxa3g20e4GOqeIWhfVQEEuawcC13xW9QZG07x00iISqD203"
);
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Order = require("./../models/orderModel");
const User = require("./../models/userModel");
const sendEmail = require("./../utils/email");
const APIFeatures = require("./../utils/apiFeatures");

exports.getAllOrders = catchAsync(async (req, res) => {
  // console.log(req.query);
  let filter = {};
  if (req.query.type) filter = { status: req.query.type };
  const features = new APIFeatures(Order.find(filter), req.query).paginate();
  const orders = await features.query;

  res.status(200).json({
    status: "success",
    data: orders,
  });
});

exports.getAllUserOrder = catchAsync(async (req, res) => {
  const orders = await Order.find();
  res.status(200).json({
    status: "success",
    data: orders,
  });
});

// getUserOrder(single order)
exports.getUserOrder = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id);
  res.status(200).json({
    status: "success",
    data: order,
  });
});


// exports.getOrderType = catchAsync(async (req, res) => {
//   // get type
//   console.log(req.params.type);
//   let filter = {};
//   if (req.params.type) filter = { status: req.params.type };
//   const orderType = await Order.find(filter);

//   res.status(200).json({
//     status: "success",
//     data: orderType,
//   });
// });

exports.getOrder = catchAsync(async (req, res) => {
  // remember to populate with users
  const order = await Order.findById(req.params.id); // remember to .populate("user");
  res.status(200).json({
    status: "success",
    data: order,
  });
});

exports.confirmOrder = catchAsync(async (req, res) => {
  console.log("Getting here");
  console.log(req.params, req.body);
  // first get the order itself with the id and populate it with the user
  // products, orderId, order-user-name, total amount, date
  const orderProduct = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  const order = await Order.findById(req.params.id);
  // console.log("Order :", order);
  const user = await User.findById(order.userId);
  // console.log("User: ", user);
  const html = `
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
    <div
        style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 5px; box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #333;">Order Confirmation</h1>
        <p style="color: #666;">Dear ${user.name},</p>
        <p style="color: #666;">Your order for ${order.products
          .map((product) => product.name)
          .join(", ")} has been successfully placed.</p>
        <p style="color: #666;">Order Number: ${order._id}</p>
        <p style="color: #666;">Total amount: &#x20A6;${order.totalAmount}</p>
        <p style="color: #666;">Order will be delivered to "${
          order.address
        }" and we will be reaching out to you at 0${order.phone}.<p/>
        <p style="color: #666;">Please contact us at <a href="mailto:temiloluwaogunti8@gmail.com" style="display: inline-block; padding: 5px 10px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 3px; margin-top: 20px;"> sales@doubledecent.com</a> or <a href="tel:+2348066771553" style="display: inline-block; padding: 5px 10px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 3px;;">Call us</a> to make edit to anay changes.</p>
        <p style="color: #666;">Thank you for shopping with us.</p>
    </div>
</body>
  `;
  // needing user's email and the orderID
  try {
    await sendEmail({
      email: user.email,
      subject: `Order confirmation - ${order._id}`,
      // message,
      html,
    });
    res.status(200).json({
      status: "success",
      data: orderProduct,
    });
  } catch (error) {
    return next(
      new AppError("There was a problem sending email to the customer", 500)
    );
  }
});

exports.handleOrderCheckOut = catchAsync(async (checkoutSession) => {
  const stripeRes = await stripe.customers.retrieve(checkoutSession.customer);

  console.log("Handle order checkout: ", checkoutSession, stripeRes);

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
  // how do i send success message to frontend??
});

exports.getCheckoutSession = catchAsync(async (req, res) => {
  const { address, phone, cartItems, deliveryFee } = req.body;
  console.log("Delivery fee: ", deliveryFee);
  // Create customer..what is customer already exists?
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

  transformedItems.push({
    quantity: 1,
    price_data: {
      currency: "NGN",
      unit_amount: deliveryFee * 100,
      product_data: {
        name: "delivery fee",
        images: [], // Provide an image URL or an empty array
      },
    },
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    client_reference_id: req.user.id,
    line_items: transformedItems,
    mode: "payment",
    currency: "NGN",
    customer: customer.id,
    success_url: "http://localhost:3000/checkout-success", //maybe add a query status for true?
    cancel_url: "http://localhost:3000/cart",
  });

  res.status(200).json({
    status: "success",
    url: session.url,
  });
});
