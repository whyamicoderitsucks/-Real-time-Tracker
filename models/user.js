const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  devicename: { type: String },
  markerColor: { type: String},
  connected: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', userSchema)