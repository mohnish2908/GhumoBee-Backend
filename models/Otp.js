const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
// const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true }, // ✅ Added email directly to schema
  otp: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 5, // auto-delete after 5 min
  },
});

// async function sendVerificationEmail(email, otp) {
//   try {
//     const mailResponse = await mailSender(
//       email,
//       "Verification Email",
//       emailTemplate(otp)
//     );
//     console.log("Email sent successfully: ", mailResponse.response);
//   } catch (error) {
//     console.error("Error sending email: ", error);
//     throw error;
//   }
// }

// otpSchema.pre("save", async function (next) {
//   console.log("New OTP document saved");
//   // if (this.isNew) {
//   //   await sendVerificationEmail(this.email, this.otp);
//   // }
//   next();
// });

module.exports = mongoose.model("Otp", otpSchema);
