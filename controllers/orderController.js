const dotenv = require("dotenv");
dotenv.config({ path: "./../config.env" });
const https = require("https");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Order = require("./../models/orderModel");
// const User = require("./../models/userModel");
const sendEmail = require("./../utils/email");
const Pagination = require("./../utils/pagination");

exports.getAllOrders = catchAsync(async (req, res) => {
  // console.log(req.query);
  const { page, limit, type } = req.query;
  let filter = {};
  if (type === "all") {
    filter = {};
  } else filter = { status: type };

  const totalItems = await Order.countDocuments(filter);
  const pagination = new Pagination(page, limit).setSort();
  const orders = await pagination.apply(Order.find(filter));
  // console.log(orders);
  

  const formattedResponse = pagination.formatResponse(orders, totalItems);

  // console.log(formattedResponse);
  

  res.status(200).json({
    status: "success",
    data: formattedResponse,
  });
});

exports.getAllUserOrder = catchAsync(async (req, res) => {
  const orders = await Order.find({ user: req.user.id });
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

exports.getOrder = catchAsync(async (req, res) => {
  // remember to populate with users
  const order = await Order.findById(req.params.id).populate({
    path: "user",
    select: "email name",
  });
  res.status(200).json({
    status: "success",
    data: order,
  });
});

exports.confirmOrder = catchAsync(async (req, res, next) => {
  // check if order exists
  const order = await Order.findById(req.params.id).populate({
    path: "user",
    select: "email name",
  });
  if (!order) {
    return next(new AppError("Order does not exist", 404));
  }

  const html = `
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
    <div
        style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 5px; box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #333;">Order Confirmation</h1>
        <p style="color: #666;">Dear ${order.user.name},</p>
        <p style="color: #666;">Your order for ${order.products
          .map((product) => product.name + " x " + product.quantity)
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
  try {
    await sendEmail({
      email: order.user.email,
      subject: `Order confirmation - ${order._id}`,
      // message,
      html,
    });

    const docsCount = await Order.find().countDocuments();
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: "success",
      data: updatedOrder,
      totalDocs: docsCount,
    });
  } catch (error) {
    return next(new AppError("There was a problem sending the mail", 500));
  }
});

const transformedItemsFunc = (cartItems, deliveryFee) => {
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
        images: [
          "https://c8.alamy.com/comp/J27BPE/motorcycle-delivery-vehicle-icon-J27BPE.jpg",
        ],
      },
    },
  });

  return transformedItems;
};

exports.getCheckoutSession = catchAsync(async (req, res) => {
  const { address, phone, cartItems, deliveryFee } = req.body;
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
        images: [
          "https://c8.alamy.com/comp/J27BPE/motorcycle-delivery-vehicle-icon-J27BPE.jpg",
        ],
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
