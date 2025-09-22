const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, default: ""},
  host: { type: mongoose.Schema.Types.ObjectId, ref: "Host", default: null },
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: "Volunteer", default: null},
  email: { type: String, required: true, unique: true }, // unique already creates an index
  phone: { type: String, index: true, default: "" },
  emergencyContactNumber: { type: String, default: "" },
  emergencyContactPersonName: { type: String, default: "" },
  password: { type: String, required: true },
  role: { type: String, enum: ["host", "volunteer", "admin"], required: true }, // Array indexing handled separately
  profilePicture: {
        asset_id: { type: String, default: "" },
        public_id: { type: String, default: "" },
        url: { type: String, default: ""},
        default: {}
  },
  dob: { type: Date, default: null },
  gender: { type: String, enum:["male", "female", "other", ""], default: "" },
  languages: { type: [String], default: [] },
  address: { type: String, default: "" },
  city: { type: String, index: true, default: "" },
  state: { type: String, default: "" },
  country: { type: String, default: "" },
  pincode: { type: String, default: "" },
  isVerified: { type: Boolean, default: false, index: true },
  aadhaarDoc: { type: String, default: "" },
}, { timestamps: true });

// Indexes for better query performance
userSchema.index({ role: 1 }); // Index for array field queries
userSchema.index({ city: 1, state: 1 }); // Compound index for location-based queries
userSchema.index({ name: 1 }); // Index for name searches
userSchema.index({ createdAt: -1 }); // Index for sorting by creation date (descending)

// Sparse indexes for host/volunteer references (only index non-null values)
// sparse:true means Means the field is optional. If some records don’t have a host or don’t have a volunteer, MongoDB will ignore those missing fields when making indexes.
userSchema.index({ host: 1 }, { sparse: true });
userSchema.index({ volunteer: 1 }, { sparse: true })  

module.exports = mongoose.model("User", userSchema);