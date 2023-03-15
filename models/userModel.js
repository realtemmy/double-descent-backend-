const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "a user must have a name"],
  },
  email: {
    type: String,
    required: [true, "a user must have an email"],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "a user must have a password"],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, "please input confirm password"],
  },
  photo: String,
  role: {
    type: String,
    default: "user",
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.confirmPassword = undefined;
  next();
});

userSchema.methods.comparePasswords = async function (
  userPassword,
  JWTEncodedPassword
) {
  return await bcrypt.compare(userPassword, JWTEncodedPassword);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
