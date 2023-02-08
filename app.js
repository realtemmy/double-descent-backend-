const express = require("express");

const app = express();
app.use(express.json())

// app.use('/sign-up', (req, res) =>{
//     console.log(req.body)
//     res.json({
//         message: "message from the backend"
//     })
// })

const userRouter = require('./routes/userRoutes')

app.use('/', userRouter)

module.exports = app;
