const fs = require('fs');
const express = require('express');
const userControllers = require('./../controllers/userController')

const router = express.Router();

router.route('/sign-up').post(userControllers.createUser)

router.route('/:id').get(userControllers.getUser)

module.exports = router;

