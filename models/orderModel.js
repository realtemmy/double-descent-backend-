const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Order must belong to a user"],
  },
  customerId: String,
  address: {
    type: String,
    required: [true, "Order must have an address for delivery"],
  },
  phone: {
    type: Number,
    required: [true, "Order must have a phone number"],
  },
  totalAmount: {
    type: Number,
    required: [true, "Order must have total amount"],
  },
  products: [
    {
      name: {
        type: String,
        required: [true, "Order product must have a name"],
      },
      quantity: {
        type: Number,
        required: [true, "Order product must have a quantity"],
      },
      image: {
        type: String,
        required: [true, "Order product must have an image"],
      },
      price: {
        type: Number,
        required: [true, "Order product must have a price"],
      },
      productId: {
        type: String,
        required: [true, "Order product must have Id"],
      },
    },
  ],
  status: {
    type: String,
    default: "paid",
    enum: {
      values: ["paid", "pending", "delivered", "cancelled"],
      message: "Status is either paid, progress, delivered, or cancelled",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "email name",
  });
  next();
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;

// customerId, date, [productBought], location, paymentId
