/* eslint-disable import/no-useless-path-segments */
const express = require("express");
const userControllers = require("./../controllers/userController");
const authController = require("./../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);

// Google login and sign up
router.post("/google", authController.googleLogin);


router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

router.post(
  "/send-mail",
  authController.protect,
  userControllers.sendUserMails
);
router.post("/address", authController.protect, userControllers.addAddress);
router.patch(
  "/address/:id",
  authController.protect,
  userControllers.updateAddress
);
router.delete(
  "/address/:id",
  authController.protect,
  userControllers.deleteAddress
);

router.get("/me", authController.protect, userControllers.getMe);
router.patch(
  "/update-password",
  authController.protect,
  authController.updatePassword
);
router.patch("/updateMe", authController.protect, userControllers.updateMe);

router.patch(
  "/upload-user-image",
  authController.protect,
  userControllers.uploadUserPhoto,
  userControllers.uploadUserToCloudinary
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
