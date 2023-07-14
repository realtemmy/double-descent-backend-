const dotenv = require("dotenv").config()
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dyrcpslwb",
  api_key: 564269647271827,
  api_secret: "Wi73vJpnaEl_a2brUcxADpFd3Sw",
});

module.exports = cloudinary;
