const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    contact: String,
    email: String,
    password: String,
    verified:Boolean,
});

const user = mongoose.model('user',userSchema);

module.exports = user;