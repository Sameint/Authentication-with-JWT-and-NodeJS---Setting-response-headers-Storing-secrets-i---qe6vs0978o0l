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
});


// Login
app.post("/login", async (req, res) => {
    //login logic starts here
});

app.post("/refresh", async (req, res) => {
    // refresh token logic starts here
})


module.exports = app;