const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
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
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;

// customerId, date, [productBought], location, paymentId
