const express = require("express");
const searchController = require("./../controllers/searchController");

const router = express.Router();

router.route("/:searchValue").get(searchController.getSearchResults);

module.exports = router;
