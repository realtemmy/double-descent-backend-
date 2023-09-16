const stripe = require("stripe")(
  "sk_test_51LsCPvGIPXZEyyN0PgYbiIPhS1S8a8zUO7SQrueZ6iBaC85607HMxa3g20e4GOqeIWhfVQEEuawcC13xW9QZG07x00iISqD203"
);
const path = require("path");
const express = require("express");
const compression = require("compression");
const cors = require("cors");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const orderController = require("./controllers/orderController");

const app = express();

const endpointSecret =
  "whsec_7e3cdfa012a58f494448e79ba1245817af82ab8a0f98a4759690af7c74ac46ab";

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
        orderController.handleOrderCheckOut(checkoutSessionCompleted);
        
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.status(200).send();
  }
);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// app.use(express.static("public"));
app.use(cors());
app.use(compression())

// Remember to delete public folder containing images

// convert multer to cloudinary in user image upload
// add limit also to the number of request sent per request in products, sections and category
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
