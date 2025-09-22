const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // skills: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }],
    skills: [
      {
        skillName: { type: String, default: ""},
        proficiencyLevel: {
          type: String,
          enum: ["beginner", "intermediate", "advanced", ""],
          default: ""
        },
        // professionLevel: { type: String, default: "" },
        description: { type: String, default: "" },
        portfolioLink: { type: String, default: "" },
        yearOfExperience: { type: String, default: "" },
      },
    ],
    bio: {
      type: String,
      default: ""
    },
    socialLinks: {
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      website: { type: String, default: "" }
    },
    achievements: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
    medicalComplication: { type: String, default: "" },
    smoke: { type: String, enum: ["yes", "never", "occasionally", ""], default: "" },
    alcohol: { type: String, enum: ["yes", "never", "occasionally", ""], default: "" },
    portfolio: { type: String, default: "" },
    profileCompletion: { type: Boolean, default: false },
    isPaidMember: { type: Boolean, default: false }, 
    available: { type: Boolean, default: true },
    
    // Subscription Management
    subscriptionStatus: { 
      type: String, 
      enum: ["inactive", "active", "expired", "cancelled"], 
      default: "inactive" 
    },
    subscriptionPlan: { 
      type: String, 
      enum: ["3 Months", "6 Months", "12 Months"], 
      default: null 
    },
    subscriptionStartDate: { type: Date, default: null },
    membershipExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes for better query performance
volunteerSchema.index({ user: 1 });
volunteerSchema.index({ skills: 1 });
volunteerSchema.index({ profileCompletion: 1, isPaidMember: 1 });
volunteerSchema.index({ subscriptionStatus: 1 });
volunteerSchema.index({ membershipExpiresAt: 1 });
volunteerSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Volunteer", volunteerSchema);
