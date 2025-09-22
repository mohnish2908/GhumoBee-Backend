const express = require("express");
const router = express.Router();

// Import Controllers
const {
  capturePayment,
  verifyPayment
} = require("../controllers/Payment");

// Import Middlewares
const { auth } = require("../middlewares/auth");

// ********************************************************************************************************
//                                      PAYMENT ROUTES
// ********************************************************************************************************

// User Routes (Protected - Authenticated Users Only)
router.post("/capture-payment", auth, capturePayment);    // Create payment order
router.post("/verify-payment", auth, verifyPayment);      // Verify payment and activate subscription

module.exports = router;
