const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "a user must have a name"],
  },
  email: {
    type: String,
    required: [true, "a user must have an email"],
    unique: true,
  },
  password:{
    type:String,
    required:[true, "a user must have a password"]
  },
  role:{
    type: String,
    required:[true, "a user must have a role"]
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
