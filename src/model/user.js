const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  //your code goes here
});

module.exports = mongoose.model("user", userSchema);