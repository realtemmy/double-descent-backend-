const mongoose = require("mongoose");
const dotenv = require("dotenv");

// const socketIO = require('socket.io');
// All sync uncaught error
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION, shutting down");
  console.log(err.name, err.message);
  process.exit();
});

const app = require("./app");
dotenv.config({ path: "./config.env" });

// const http = require("http").createServer(app);

// const { Server } = require("socket.io");

// const io = new Server(http, {
//   cors: {
//     origin: "http://localhost:3001",
//     credentials: true,
//   },
// });

// io.on('connection', (socket) => {
//   console.log("Connected to socketIO: ", socket);
// })
// io.on("connection", (socket) => {
//   // console.log("Connected to socketIO: ", socket);
//   socket.emit("hello", "world");
// });

// http.listen(3000, () => {
//   console.log("Successfully connected to node server");
// });

const DB = process.env.DATABASE_LOCAL;
// const DB = process.env.DATABASE;

mongoose.set("strictQuery", false);

mongoose.connect(DB, () => {
  console.log("Connected to MongoDB.");
});

mongoose.connection.on("error", (err) => {
  console.log("error: ", err);
});

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});

// All async uncaught error
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message, err);
  console.log("UNHANDLED REJECTION, shutting down");
  server.close(() => {
    process.exit();
  });
});
