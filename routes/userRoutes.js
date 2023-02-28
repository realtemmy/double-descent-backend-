const express = require("express");

const userControllers = require("./../controllers/userController");

const router = express.Router();

router
  .route("/")
  .get(userControllers.getAllUsers)
  .post(userControllers.createUser);

router
  .route("/:id")
  .delete(userControllers.deleteUser)
  .patch(userControllers.updateUser)
  .post(userControllers.getUser);


module.exports = router;
