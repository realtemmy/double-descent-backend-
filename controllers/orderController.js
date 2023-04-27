const Order = require("./../models/orderModel");

exports.getAllOrder = async (req, res) => {
  const orders = await Order.findById(req.user.id);
  res.status(200).json({
    status: "success",
    data: { orders },
  });
};

exports.createOrder = async (req, res) => {
  if (!req.body.user) req.body.user = req.user.id;
  const newOrder = await Order.create(req.body);
  res.status(201).json({
    status: "success",
    body: { newOrder },
  });
};
