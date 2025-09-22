const mongoose = require("mongoose");
const User = require("./User");

const applicationSchema = new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId, ref: "User", required: true},
  // volunteer: { type: mongoose.Schema.Types.ObjectId, ref: "Volunteer", required: true },
  opportunity: { type: mongoose.Schema.Types.ObjectId, ref: "Opportunity", required: true },
  status: {
    type: String,
    enum: ["pending", "shortlisted", "approved", "rejected", "withdrawn","volunteering"],
    default: "pending"
  },
  from:{type:Date, default: null},
  to:{type:Date, default: null},
  applicationDate: { type: Date, default: Date.now },
  message: { type: String, default: "" },
  coverLetter: { type: String, default: "" },
}, { timestamps: { createdAt: 'submittedAt', updatedAt: 'updatedAt' } });

/* ✅ Essential indexes */

// Unique to prevent duplicate applications
applicationSchema.index({ user: 1, opportunity: 1 }, { unique: true });

// For filtering & sorting applications for a volunteer
applicationSchema.index({ user: 1, status: 1 });

// For managing opportunity applications by status
applicationSchema.index({ opportunity: 1, status: 1 });

// For getting latest applications by status
applicationSchema.index({ status: 1, submittedAt: -1 });

module.exports = mongoose.model("Application", applicationSchema);
