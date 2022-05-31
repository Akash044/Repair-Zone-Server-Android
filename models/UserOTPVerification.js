const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userOTPVerificationSchema = new Schema({
    userID: String,
    otp: String,
    createAt: Date,
    expiresAt: Date,
});

const userOTPVerification = mongoose.model('userOTPVerification',userOTPVerificationSchema);

module.exports = userOTPVerification;