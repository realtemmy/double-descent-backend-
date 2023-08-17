const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
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
        required: [true, "Product must have a name"],
      },
      quantity: {
        type: Number,
        required: [true, "Product must have a quantity"],
      },
    },
  ],
  status:{
    type:String,
    default: "pending"
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;

// customerId, date, [productBought], location, paymentId
