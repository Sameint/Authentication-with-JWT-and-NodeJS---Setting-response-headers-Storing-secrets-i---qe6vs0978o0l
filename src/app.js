require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const app = express();
const tokenList = {}

app.use(express.json());

const auth = require("./middleware/auth");

// Your code goes here
const User = require("./model/user");

app.post("/register", async (req, res) => {
    // register logic starts here
     try {
    const { first_name, last_name, email, password } = req.body;

    if (!(email && password && first_name && last_name)) {
      return res.status(400).send("Please fill up all fields");
    }

    // check if user already exists
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login");
    }

    // hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // create user in the database
    const user = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password: passwordHash,
    });

    // create a new JWT token
    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.TOKEN_KEY,
      {
        expiresIn: "6h",
      }
    );

    // save the refresh token
    const refreshToken = jwt.sign(
      { user_id: user._id, email },
      process.env.REFRESH_TOKEN_KEY
    );
    tokenList[refreshToken] = { email, token };

    // send back the token
    user.token = token;
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});


// Login
app.post("/login", async (req, res) => {
    //login logic starts here
    try {
    const { email, password } = req.body;

    if (!(email && password)) {
      return res.status(400).send("All input is required");
    }

    // check if user exists
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // create a new JWT token
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.TOKEN_KEY,
        { expiresIn: "6h" }
      );

      // save the refresh token
      const refreshToken = jwt.sign(
        { user_id: user._id, email },
        process.env.REFRESH_TOKEN_KEY
      );
      tokenList[refreshToken] = { email, token };

      // send back the token
      res.status(200).json({ token, refreshToken });
    } else {
      res.status(400).send("Invalid Credentials");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.post("/refresh", async (req, res) => {
    // refresh token logic starts here
    const { email, password, refreshToken } = req.body;

  // Check if refresh token is valid
  if ((refreshToken in tokenList) && (tokenList[refreshToken] === email)) {
    try {
      // Verify user credentials
      const user = await User.findOne({ email });
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(400).send("Invalid Request");
      }

      // Generate new access token
      const accessToken = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '6h' });

      // Send new access token and refresh token
      return res.status(200).json({ accessToken, refreshToken });
    } catch (error) {
      return res.status(500).send(error);
    }
  }

  // Return error if refresh token is invalid
  return res.status(404).send("Invalid Request");
})


module.exports = app;
