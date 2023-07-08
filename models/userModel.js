const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
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
    validate: [validator.isEmail, "Please provide a valid email."],
  },
  password: {
    type: String,
    required: [true, "a user must have a password"],
    select: false,
  },
  confirmPassword: {
    // Remember to validate
    type: String,
    required: [true, "please input confirm password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  role: {
    // if u later change to isAdmin format, remamber to change in restrict middleware at authcontroller
    type: String,
    default: "user",
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordExpiresAt: Date,
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

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamps < changedTimeStamp;
  }

  return false;
};

// userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
//   if (this.passwordChangedAt) {
//     // Add null check
//     const changedTimeStamp = parseInt(
//       this.passwordChangedAt.getTime() / 1000,
//       10
//     );
//     return JWTTimeStamp < changedTimeStamp;
//   }

//   return false;
// };

userSchema.methods.createPasswordResetToken = function () {
  // generate 32 byte token
  const resetToken = crypto.randomBytes(32).toString("hex");
  // Hashed token to be stored in DB
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);

  // password should expire in 10 mins
  this.passwordExpiresAt = Date.now() + 10 * 1000 * 60;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
