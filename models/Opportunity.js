const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema(
  {
    host: { type: mongoose.Schema.Types.ObjectId, ref: "Host", required: true },
    title: { type: String,default: "" },
    description: { type: String, required: true },
    volunteerIn: { type: String, default: "" },
    images: [
      {
        asset_id: { type: String, default: "" },
        public_id: { type: String, default: "" },
        url: { type: String, required: true }
      }
    ],
    state: { type: String, required: true },
    district: { type: String, default: "" },
    propertyName: { type: String, default: "" },
    propertyAddress: { type: String, default: "" },
    propertyType: [{ type: String }],
    businessLink: { type: String, default: "" },
    volunteerNeeded: { type: Number, required: true, min: 1 },
    safeForFemale: { type: Boolean, default: true },
    location: { type: String, default: "" },
    roomType: [{ type: String }],
    meals: { type: String },
    amenities: [{ type: String }],
    transport: [{ type: String }],
    workingHours: { type: Number, min: 0, max: 24, default: 0 },
    daysOff: { type: Number, min: 0, max: 6, default: 0 },
    minimumDuration: { type: Number, min: 1, default: 1 },
    maximumDuration: { type: Number, default: null },
    skills: [{ type: String }],
    expectations: { type: String, default: "" },
    aboutLocation: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive", "completed", "cancelled"], default: "active" },
    applications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Application" }],
    isActive: { type: Boolean, default: true },
    // startDate: { type: Date, required: true },
    // endDate: { type: Date }, // Added end date
  },
  { timestamps: true }
);

/* ✅ Essential Indexes */

// Primary host filter
opportunitySchema.index({ host: 1, status: 1 });

// State + district filtering
opportunitySchema.index({ state: 1, district: 1 });

// Location + safety filter
opportunitySchema.index({ state: 1, safeForFemale: 1 });

// Skill + location matching
opportunitySchema.index({ skills: 1, state: 1 });

// Active opportunities quick lookup
opportunitySchema.index({ status: 1, isActive: 1 });

// Full text search for discoverability
opportunitySchema.index({ title: 'text', description: 'text', aboutLocation: 'text' });

module.exports = mongoose.model("Opportunity", opportunitySchema);
