const Razorpay = require("razorpay");

exports.instance = new Razorpay({
	key_id: process.env.RAZORPAY_KEY_ID,
	key_secret: process.env.RAZORPAY_KEY_SECRET,
});



// const RAZORPAY_KEY = 

// const RAZORPAY_SECRET = 

// exports.instance = new Razorpay({
// 	key_id: RAZORPAY_KEY,
// 	key_secret: RAZORPAY_SECRET,
// });