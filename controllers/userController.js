const {
  findByIdAndUpdate,
  findByIdAndDelete,
} = require("./../models/userModel");

const User = require("./../models/userModel");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      status: "success",
      results: users.length,
      data: { users },
    });
  } catch (error) {
    res.json({
      status: "fail",
      data: { error },
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    // let getUser = User.findById(req.body.id)
    // const user = getUser.findOne({email: req.body.email})
    const user = await User.findOne({email: req.body.email});
    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      data: { error },
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).json({
      status: "success",
      data: newUser,
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      data: { error },
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    console.log(req.body.id);
    const updateUser = await User.findByIdAndUpdate(req.body.id, req.body, {
      new: true,
      runValidators: true,
    });
    console.log(updateUser);
    res.status(200).json({
      status: "success",
      data: { updateUser },
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      data: { error },
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      data: error,
    });
  }
};
