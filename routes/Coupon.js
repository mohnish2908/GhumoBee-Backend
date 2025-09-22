const express = require("express");
const router = express.Router();

// Import Controllers
const {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon
} = require("../controllers/Coupon");

// Import Middlewares
const { auth, isAdmin } = require("../middlewares/auth");

// ********************************************************************************************************
//                                      COUPON ROUTES
// ********************************************************************************************************

// Admin Routes (Protected - Admin Only)
router.post("/create", auth, isAdmin, createCoupon);           // Create new coupon
router.get("/admin/all", auth, isAdmin, getAllCoupons);        // Get all coupons for admin dashboard
router.get("/admin/:couponId", auth, isAdmin, getCouponById);  // Get coupon details for admin
router.put("/admin/:couponId", auth, isAdmin, updateCoupon);   // Update coupon
router.delete("/admin/:couponId", auth, isAdmin, deleteCoupon); // Soft delete coupon

// Public/User Routes
router.post("/validate", auth, validateCoupon);                // Validate coupon during checkout

module.exports = router;