const Order = require("./../models/orderModel");
// import sendEmail from "../utils/email";
const sendMail = require("./../utils/email");

exports.getAllUserOrder = async (req, res) => {
  const orders = await Order.findById(req.user.id);
  res.status(200).json({
    status: "success",
    data: orders,
  });
};

const calculateTotalAmount = (items, deliveryFee) => {
  let amount = 0;
  items.forEach((item) => {
    amount += item.quantity * item.price;
  });
  amount += deliveryFee;
  return amount;
};

const getEachProductAndQuantity = (items) => {
  const product = items.map((product) => {
    const { name, quantity, image } = product;
    return {name, quantity, image}
  });
  console.log(product);
  return product;
};

exports.createOrder = async (req, res, next) => {
  // Creating of order would be immediately after stripe payment is successful
  // The totalAmount would be calculated before it saves in the db from the incoming items
  // The product and quantity would also come from the array of items
  // user_id, address and phone number would be from the logged in user or
  // anyone that's inputted on the frontend sha

  // And paymentId if stripe gives one

  const { address, phone, cartItems, deliveryFee } = req.body;

  const totalAmount = calculateTotalAmount(cartItems, deliveryFee);
  const products = getEachProductAndQuantity(cartItems);
  console.log(products, req.user);

  const newOrder = await Order.create({
    userId: req.user.id,
    address,
    phone,
    totalAmount,
    products,
  });

    res.status(201).json({
      status: "success",
      body: newOrder,
    });
};
