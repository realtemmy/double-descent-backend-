require("dotenv").config();
const asynchandler = require("express-async-handler");
const stripe = require("stripe")(
  "sk_test_51LsCPvGIPXZEyyN0PgYbiIPhS1S8a8zUO7SQrueZ6iBaC85607HMxa3g20e4GOqeIWhfVQEEuawcC13xW9QZG07x00iISqD203"
);
const https = require("https");

// create payment for paystack here,the transfer mode etc.

const calculateTotalAmount = (items, deliveryFee) => {
  let amount = 0;
  items.forEach((item) => {
    amount += item.quantity * item.price;
  });
  amount += deliveryFee;
  return amount * 100;
};

exports.createPaymentIntent = asynchandler(async (req, res) => {
  const { cartItems, deliveryFee, address, phone, email, user_id } = req.body;
  // Reveives the whole item as an array, the user_id,
  // name, email address, and delivery fee
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateTotalAmount(cartItems, deliveryFee),
    currency: "NGN",
    payment_method_types: ["card"],
    customer: user_id,
    receipt_email: email,
  });

  res.status(200).json({
    status: "success",
    clientSecret: paymentIntent.client_secret,
  });
});

exports.getPaystackCheckoutSession = asynchandler(async (request, response) => {
  const { address, phone, cartItems, deliveryFee } = request.body;

  console.log("Paystack: Getting here");
  const params = JSON.stringify({
    email: request.user.email,
    amount: calculateTotalAmount(cartItems, deliveryFee),
    metadata: {
      address,
      phone,
      cartItems,
      deliveryFee,
      userId: request.user.id,
    },
    custom_fields: [
      {
        display_name: "Customer's name",
        variable_name: "customer_name",
        value: request.user.name,
      },
      // display name for emails maybe?
    ],
  });

  // metadata cartItems, address, phone, deliveryFee, userId

  const options = {
    hostname: "api.paystack.co",
    port: 443,
    path: "/transaction/initialize",
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  };

  const req = https
    .request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log(JSON.parse(data));
        response.json({
          status: "success",
          url: JSON.parse(data).data.authorization_url,
        });
      });
    })
    .on("error", (error) => {
      console.error(error);
    });

  req.write(params);
  req.end();
});
