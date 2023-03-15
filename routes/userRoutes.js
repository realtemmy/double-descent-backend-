/* eslint-disable import/no-useless-path-segments */
const express = require("express");

const userControllers = require("./../controllers/userController");
const authController = require("./../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);


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
