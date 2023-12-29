const express = require("express");
const helperController = require("./../controllers/helperController");
const authController = require("./../controllers/authController");

const router = express.Router();

// search products, categories, section, user and product?

router.route("/search/:searchValue").get(helperController.getSearchResults);
// search name an email
router
  .route("/send-mail")
  .post(
    authController.protect,
    authController.restrictToAdmin,
    helperController.sendEmails
  );

router.route('/user-message').post(authController.protect, helperController.userComplaintsMessages)

module.exports = router;
