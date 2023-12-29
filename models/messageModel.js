const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    required: [true, "Message must belong to a user"],
  },
  email: {
    type:String,
    required: [true, "Should have an email"]
  },
  message: {
    type: String,
    required: [true, "Must have a message"],
  },
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
