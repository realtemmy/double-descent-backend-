const express = require("express");

const app = express();
app.use(express.json())

const userRouter = require('./routes/userRoutes')
const productRouter = require('./routes/productRoutes')

app.use('/user', userRouter)
app.use('/product', productRouter)

module.exports = app;
