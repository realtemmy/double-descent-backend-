const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  products: [String], //embedding products
  location:{
    type:String,
    required: [true, "Please input location for delivery"]
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

// customerId, date, [productBought], location, paymentId