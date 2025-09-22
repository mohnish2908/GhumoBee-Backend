const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    // Unique coupon code (stored uppercase)
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    // Optional description
    description: {
      type: String,
      default: "",
    },

    // Fixed discount amount
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    // Minimum order value required to apply the coupon
    minOrderValue: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Total times coupon can be used across all users (0 or undefined -> unlimited)
    usageLimit: {
      type: Number,
      min: 0,
    },

    // How many times it has been used so far
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Track which users used it (enforces one-time-per-user if you check before applying)
    usersUsed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Expiration datetime (coupon becomes invalid after this)
    expiresAt: {
      type: Date,
    },

    // Quick enable/disable flag
    isActive: {
      type: Boolean,
      default: true,
    },

    // Reference to User who created it (optional)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Helpful indexes
// The unique code index is already created by `unique: true` above, so we don't need to add it explicitly

// Fast lookups for currently valid & active coupons
couponSchema.index({ isActive: 1, expiresAt: 1 });

// Querying by creator
couponSchema.index({ createdBy: 1, isActive: 1 });

// Efficient check if a user has already used a coupon
couponSchema.index({ usersUsed: 1 });

// Optional: prioritize coupons with remaining usage when usageLimit is set
couponSchema.index(
  { isActive: 1, usedCount: 1 },
  { partialFilterExpression: { usageLimit: { $gt: 0 } } }
);

module.exports = mongoose.model("Coupon", couponSchema);
