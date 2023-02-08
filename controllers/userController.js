const fs = require("fs");

// Local db for now
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/users.json`)
);

exports.createUser = (req, res) => {
  const userEmailExist = users.find((user) => user.email == req.body.email);
  if (userEmailExist) {
    return res.status(400).json({
      status: "fail",
      message: "User email already exists",
    });
  }
  let newId = users[users.length - 1].id + 1;
  const newUser = Object.assign({ id: newId }, req.body);
  users.push(newUser);
  fs.writeFile(
    `${__dirname}/../dev-data/users.json`,
    JSON.stringify(users),
    (err) => {
      res.status(201).json({
        status: "success",
        data: newUser,
      });
    }
  );
};
exports.getUser = (req, res) => {
  const userExist = users.find(user => user.email === req.body.email && user.password === req.body.password)
  if (!userExist) {
    return res.status(400).json({
      status: 'fail',
      message:'account does not exist'
    })
  }
  res.status().json({
    status: "success",
    data: "user info to be inplemented in a bit sha",
  });
};
