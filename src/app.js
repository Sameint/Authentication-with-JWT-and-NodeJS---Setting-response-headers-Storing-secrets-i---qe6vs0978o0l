require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = express();
const tokenList = {};

app.use(express.json());
// const auth = require("./middleware/auth");

// Your code goes here
const User = require("./model/user");

app.post("/api/register", async (req, res) => {
  try {
    let { email, password, first_name, last_name } = req.body;
    console.log(email);
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(email)) {
      return res.status(400).send("Enter correct email.");
    }

    if (password.length < 8) {
      return res.status(400).send("Minimum password length required is 8.");
    }
    let isPresent = await User.exists({ email: email });
    if (isPresent) {
      return res.status(409).send("User Already Exist. Please Login");
    }
    let hashed = await bcrypt.hash(password, 10);
    let user = new User({
      email: email,
      first_name: first_name,
      last_name: last_name,
      password: hashed,
    });
    await user.save();
    let token = jwt.sign({ userId: user._id }, process.env.TOKEN_KEY, {
      expiresIn: "6h",
    });
    return res
      .status(201)
      .json({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        password: user.password,
        token: token,
      });
  } catch {
    res.status(400).send("Please fill up all fields");
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      res.status(400).send("All input is required");
    }
    let user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).send("Invalid Credentials");
    }
    let isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).send("Invalid Credentials");
    }
    let refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_KEY,
      {
        expiresIn: "24h",
      }
    );
    tokenList[user._id] = refreshToken;
    let token = jwt.sign({ userId: user._id }, process.env.TOKEN_KEY, {
      expiresIn: "6h",
    });
    res.status(200).json({ token, refreshToken });
  } catch(e) {
    res.status(400).send("All input is required");
  }
});

app.post("/api/refresh", async (req, res) => {
  try {
    const { email, password, refreshToken } = req.body;
    let user = await User.findOne({ email: email });
    if (user) {
      if (
        (await bcrypt.compare(password, user.password)) &&
        tokenList[user._id] === refreshToken
      ) {
        let token = jwt.sign({ userId: user._id }, process.env.TOKEN_KEY, {
          expiresIn: "6h",
        });
        res
          .status(200)
          .json({ email: user.email, password: user.password, token: token });
      }
    }
    res.status(404).send("Invalid Request");
  } catch {
    res.status(404).send("Invalid Request");
  }
});

app.post("/api/welcome", (req, res) => {
  try {
    let token = req.header("x-access-token");
    jwt.verify(token, process.env.TOKEN_KEY);
    res.send("Welcome User!");
  } catch (error) {
    res.status(403).send(error.message);
  }
});

module.exports = app;
