const mongoose = require("mongoose");
const dotenv = require("dotenv");

// All sync uncaught error
process.on("uncaughtException", err=>{
  console.log("UNCAUGHT EXCEPTION, shutting down");
  console.log(err.name, err.message);
  process.exit()
})

const app = require("./app");
dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE_LOCAL;

mongoose.set("strictQuery", false);

mongoose.connect(DB, () => {
  console.log("Connected to MongoDB");
});


const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});

// All async uncught error
process.on("unhandledRejection", (err)=>{
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION, shutting down");
  server.close(()=>{
    process.exit()
  })
})