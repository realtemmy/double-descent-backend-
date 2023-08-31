const express = require("express");
const authController = require("./../controllers/authController");
const sectionController = require("./../controllers/sectionController");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(sectionController.getAllSections)
  .post(
    authController.protect,
    authController.restrictToAdmin,
    sectionController.createSection
  );

router
  .route("/:id")
  .get(sectionController.getSection)
  .delete(
    authController.protect,
    authController.restrictToAdmin,
    sectionController.deleteSection
  )
  .patch(
    authController.protect,
    authController.restrictToAdmin,
    sectionController.updateSection
  );

module.exports = router;
