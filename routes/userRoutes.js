const express = require('express')

const userControllers = require('./../controllers/userController')

const router = express.Router();

router.route('/sign-up').get(userControllers.getAllUsers).post(userControllers.createUser)

router.route('/sign-up/:id').post(userControllers.getUser).delete(userControllers.deleteUser).patch(userControllers.updateUser)

router.route('/sign-in').get(userControllers.getUser);


module.exports = router;

