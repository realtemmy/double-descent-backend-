/* eslint-disable import/no-useless-path-segments */
const express = require("express");
const userControllers = require("./../controllers/userController");
const authController = require("./../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

router.get("/me", authController.protect, userControllers.getMe);
router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.updatePassword
);
router.patch(
  "/updateMe",
  authController.protect,
  userControllers.uploadUserPhoto,
  userControllers.uploadUserToCloudinary,
  // userControllers.resizeUserPhoto,
  userControllers.updateMe
);

router
  .route("/")
  .get(userControllers.getAllUsers)
  .post(userControllers.createUser);

router
  .route("/:id")
  .delete(userControllers.deleteUser)
  .patch(userControllers.updateUser)
  .get(userControllers.getUser);

module.exports = router;
