const mongoose = require("mongoose");

const hostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  designation: [{ type: String, enum: ["owner", "partner", "manager"] }],
  organizationName: { type: String, default: "" },
  organizationType: [{ 
    type: String, 
    enum: ["Non-profit", "corporate", "government org", "startup", "business", "ngo", "initiative", "other"]
  }],
  needOfVolunteer: [{ type: String }],
  businessDocument: { type: String, default: "" },
  bio: { type: String, default: "" },
  profileCompletion: { type: Boolean, default: false },
  isPaidHost: { type: Boolean, default: false },
  opportunitiesPosted: [{ type: mongoose.Schema.Types.ObjectId, ref: "Opportunity" }],
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "RatingAndReview" }],
  socialLinks: {
    instagram: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    website: { type: String, default: "" }
  },
  
}, { timestamps: true });

/* ✅ Essential indexes */

// Primary lookup (one host per user)
hostSchema.index({ user: 1 }, { unique: true });

// Filter paid hosts by org type
hostSchema.index({ organizationType: 1, isPaidHost: 1 });

// Filter complete + paid profiles
hostSchema.index({ profileCompletion: 1, isPaidHost: 1 });

// Text search for org name and bio
hostSchema.index({ organizationName: 'text', bio: 'text' });

module.exports = mongoose.model("Host", hostSchema);
