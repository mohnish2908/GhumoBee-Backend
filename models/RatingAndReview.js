const mongoose = require("mongoose");

const ratingAndReviewSchema = new mongoose.Schema({
  opportunity: { type: mongoose.Schema.Types.ObjectId, ref: "Opportunity", required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: "Host", required: true },
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: "Volunteer", required: true },
  rating: { 
    type: Number, 
    min: [1, 'Rating must be at least 1'], 
    max: [5, 'Rating cannot exceed 5'], 
    required: true 
  }
}, { timestamps: true });

/* ✅ Essential Indexes */

// Prevent duplicate reviews
ratingAndReviewSchema.index({ opportunity: 1, volunteer: 1, host: 1 }, { unique: true });

// Reviews by opportunity
ratingAndReviewSchema.index({ opportunity: 1 });

// Host rating analysis
ratingAndReviewSchema.index({ host: 1, rating: 1 });

// Volunteer rating analysis
ratingAndReviewSchema.index({ volunteer: 1, rating: 1 });

// Sort by newest
ratingAndReviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model("RatingAndReview", ratingAndReviewSchema);
