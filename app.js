const stripe = require("stripe")(
  "sk_test_51LsCPvGIPXZEyyN0PgYbiIPhS1S8a8zUO7SQrueZ6iBaC85607HMxa3g20e4GOqeIWhfVQEEuawcC13xW9QZG07x00iISqD203"
);
// const http = require("http");
// const socketIO = require("socket.io");
// const path = require("path");
const express = require("express");
const compression = require("compression");
const cors = require("cors");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
// const orderController = require("./controllers/orderController");
const Order = require("./models/orderModel");

const app = express();

const http = require("http").createServer(app);

const { Server } = require("socket.io");

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
  console.log("Successfully connected to node server");
});

const endpointSecret =
  "whsec_7e3cdfa012a58f494448e79ba1245817af82ab8a0f98a4759690af7c74ac46ab";

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const sig = request.headers["stripe-signature"];
    console.log("Getting here");

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
    totalAmount: session.amount_total / 100,
    products: products.map((product, idx) => ({
      name: product.name,
      productId: product.id,
      image: product.images[0],
      quantity: session.line_items.data[idx].quantity,
      price: session.line_items.data[idx].price.unit_amount / 100,
    })),
  });
  const latestOrder = await Order.findById(newOrder._id)
  console.log(latestOrder);

  return latestOrder;
};

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(compression());

// Search route

const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const sectionRoutes = require("./routes/sectionRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const searchRoutes = require("./routes/searchRoutes");

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/sections", sectionRoutes);
app.use("/api/v1/checkout/create-payment-intent", paymentRoutes);
app.use("/api/v1/search", searchRoutes);

// All undefined routes
app.use("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
