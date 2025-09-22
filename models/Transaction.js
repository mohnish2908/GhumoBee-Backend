const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  // User making the payment
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Razorpay Payment Info
  razorpayOrderId: { type: String, default: "" },
  razorpayPaymentId: { type: String, index: true, default: "" },
  razorpaySignature: { type: String, default: "" },

  // Amount & Currency
  amount: { type: Number, required: true, min: [0, "Amount cannot be negative"] },
  finallAmount: { type: Number, required: true, min: [0, "Final amount cannot be negative"] }, // Note: keeping original field name
  currency: { type: String, default: "INR", enum: ["INR", "USD", "EUR"] },

  coupon: { type: String, default: "" },

  // Plan duration
  plan: { type: String, default: "" }, // Added plan

  // Payment Status
  status: {
    type: String,
    enum: ["created", "attempted", "paid", "failed", "cancelled", "refunded", "partial_refund", "completed"],
    default: "attempted",
    required: true,
    index: true
  },

  // Payment completion timestamp
  paidAt: { type: Date, default: null },

  // Auto timestamps
}, { timestamps: true });

// Common indexes
transactionSchema.index({ user: 1, status: 1 });
// transactionSchema.index({ transactionType: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });

// Quick lookups
transactionSchema.statics.findByRazorpayOrderId = function(orderId) {
  return this.findOne({ razorpayOrderId: orderId });
};
transactionSchema.statics.findByRazorpayPaymentId = function(paymentId) {
  return this.findOne({ razorpayPaymentId: paymentId });
};

module.exports = mongoose.model("Transaction", transactionSchema);
