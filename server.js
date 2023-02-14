const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./app");
dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE_LOCAL;

mongoose.set("strictQuery", false);

mongoose.connect(DB, () => {
  console.log("Connected to MongoDB");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
