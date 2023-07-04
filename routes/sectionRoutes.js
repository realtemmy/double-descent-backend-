const express = require("express");
const authController = require("./../controllers/authController");
const sectionController = require("./../controllers/sectionController");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(sectionController.getAllSections)
  .post(sectionController.createSection);

router
  .route("/:id")
  .get(sectionController.getSection)
  .delete(sectionController.deleteSection)
  .patch(sectionController.updateSection);

module.exports = router;
