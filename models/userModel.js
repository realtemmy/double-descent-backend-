const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "a user must have a name"],
  },
  email: {
    type: String,
    required: [true, "a user must have an email"],
    unique: true,
    lowercase:true
  },
  password: {
    type: String,
    required: [true, "a user must have a password"],
  },
  confirmPassword: {
    type: String,
    required: [true, "please input confirm password"],
  },
  photo: String,
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
