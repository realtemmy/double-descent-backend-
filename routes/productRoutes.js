const express = require('express');
const productController = require('./../controllers/productController')

const router = express.Router();

router.route('/shop').get(productController.getAllProducts)
gi
module.exports = router
