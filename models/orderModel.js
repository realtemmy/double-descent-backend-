const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Order must belong to a user"],
    },
    transactionId: {
      type: String,
      required: [true, "An order must have a transactionId"],
    },
    transactionReference: {
      type: String,
      required: [true, "Order is missing transaction reference"],
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
        values: ["paid", "confirmed", "delivered", "cancelled"],
        message: "{value} is not supported.",
      },
    },
    refund: {
      refundReference: String,
      amount: Number,
      status: String,
      processedAt: Date,
    },
    paymentMode: {
      type: String,
      required: [true, "Please enter mode of  payment"],
    },
    paymentChannel: String,
    deliveryFee: {
      type: Number,
      required: [true, "Delivery fee not set"],
    },
    statusDates: {
      paid: { type: Date, default: null },
      confirmed: { type: Date, default: null },
      delivered: { type: Date, default: null },
      cancelled: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre("save", function (next) {
  if (!this.isModified("status")) return next();

  const now = new Date();
  if (this.status === "paid") this.statusDates.paid = now;
  if (this.status === "confirmed") this.statusDates.confirmed = now;
  if (this.status === "delivered") this.statusDates.delivered = now;
  if (this.status === "cancelled") this.statusDates.cancelled = now;

  next();
});

orderSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  console.log("Update: ", update);

  if (update.status) {
    const now = new Date();

    if (update.status === "paid") update["statusDates.paid"] = now;
    if (update.status === "confirmed") update["statusDates.confirmed"] = now;
    if (update.status === "delivered") update["statusDates.delivered"] = now;
    if (update.status === "cancelled") update["statusDates.cancelled"] = now;
  }

  next();
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
