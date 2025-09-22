const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
  skillName: { type: String, required: true },
  proficiencyLevel: { type: String, default: "" }, // e.g., beginner, intermediate, advanced
  professionType: { type: String, default: "" },
  description: { type: String, default: "" },
  portfolioLink: { type: String, default: "" },
  yearOfExperience: { type: String, default: "" }
}, { timestamps: true });

/* ✅ Essential Indexes */

// Unique skill names
skillSchema.index({ skillName: 1 }, { unique: true });

// For filtering skills by profession + proficiency (common combo)
skillSchema.index({ professionType: 1, proficiencyLevel: 1 });

// For skill search
skillSchema.index({ skillName: "text", description: "text" });

// Sort newest skills
skillSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Skill", skillSchema);
