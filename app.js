const crypto = require("crypto");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const express = require("express");
const compression = require("compression");
const cors = require("cors");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const Order = require("./models/orderModel");

const app = express();

// ======= SocketIO ======== //
const { Server } = require("socket.io");
const http = require("http").createServer(app);

const io = new Server(http, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});
io.on("connection", (socket) => {
  // console.log("Connected to socketIO: ", socket);
  socket.emit("hello", "world");
});

http.listen(4000, () => {
  console.log("Successfully connected to node server --SocketIO");
});

const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const sig = request.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const checkoutSessionCompleted = event.data.object;
        // Then define and call a function to handle the event checkout.session.completed
        const createdOrder = await createOrder(checkoutSessionCompleted);
        io.emit("newOrder", createdOrder);
        break;
      // ... handle other event types
      // eg refund and update to cancelled maybe
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.status(200).send();
  }
);

const createOrder = async (checkoutSession) => {
  const stripeRes = await stripe.customers.retrieve(checkoutSession.customer);
  // console.log(stripe);

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
  const newOrder = await Order.create({
    user: stripeRes.metadata.userId,
    customerId: stripeRes.id,
    address: stripeRes.metadata.address,
    phone: stripeRes.metadata.phone,
    paymentMode: "Stripe",
    totalAmount: session.amount_total / 100,
    products: products.map((product, idx) => ({
      name: product.name,
      productId: product.id,
      image: product.images[0],
      quantity: session.line_items.data[idx].quantity,
      price: session.line_items.data[idx].price.unit_amount / 100,
    })),
  });
  const latestOrder = await Order.findById(newOrder._id).populate({
    path: "user",
    select: "email name",
  });
  console.log(latestOrder);

  return latestOrder;
};

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(compression());

/* ====================================
  PayStack Webhook
==================================== */
const verify = (eventData, signature) => {
  const hmac = crypto.createHmac(
    "sha512",
    process.env.PAYSTACK_TEST_SECRET_KEY
  );
  const expectedSignature = hmac
    .update(JSON.stringify(eventData))
    .digest("hex");
  return expectedSignature === signature;
};

app.post("/paystack/webhook", async (req, res, next) => {
  const eventData = req.body;
  const signature = req.headers["x-paystack-signature"];

  if (!verify(eventData, signature)) {
    return res.sendStatus(400);
  }

  if (eventData.event === "charge.success") {
    const transactionId = eventData.data.id;
    const { data } = eventData;
    const newOder = await Order.create({
      user: data.metadata.userId,
      transactionId: transactionId,
      transactionReference: data.reference,
      customerId: data.customer.customer_code,
      address: data.metadata.address,
      phone: data.metadata.phone,
      totalAmount: data.amount / 100,
      paymentMode: "Paystack",
      paymentChannel: data.channel,
      deliveryFee: data.metadata.deliveryFee,
      products: data.metadata.cartItems.map((product) => ({
        name: product.name,
        productId: product._id,
        quantity: product.quantity,
        price: product.price,
        image: product.image,
      })),
    });
    // refund.processed, refund.failed, reversed
    const latestOrder = await Order.findById(newOder._id).populate({
      path: "user",
      select: "name email",
    });

    // seend order to admin
    io.emit("newOrder", latestOrder);
  }
  if (eventData.event === "refund.processed") {
    // update status to cancelled and refunded
    const { data } = eventData;
    const order = Order.findOne({
      transactionReference: data.transaction_reference,
    });
    if (!order) {
      return next(
        new AppError(
          `No order with reference ${data.transaction_reference} found`,
          404
        )
      );
    }
    (order.status = "cancelled"),
      (order.refund = {
        refundReference: data.refund_reference,
        amount: data.amount,
        status: data.status,
        processedAt: new Date(),
      });
    await order.save();
    // Send an email to the user and move all these to order controller
  }

  return res.sendStatus(200);
});

const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const sectionRoutes = require("./routes/sectionRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const helperRoutes = require("./routes/helperRoutes");

// ================ Routes Middlewares ================= //

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/sections", sectionRoutes);
app.use("/api/v1/checkout/create-payment-intent", paymentRoutes);
app.use("/api/v1/help", helperRoutes);

// All undefined routes
app.use("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
