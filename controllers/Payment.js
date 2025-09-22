const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Volunteer = require("../models/Volunteer");
const Coupon = require("../models/Coupon");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

// Initialize Razorpay instance
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

exports.capturePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan, coupon } = req.body;
    let price;
    let validCoupon = null; // Initialize validCoupon variable
    
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    
    // Check if user is a volunteer
    if (user.role !== 'volunteer') {
      return res
        .status(403)
        .json({ success: false, message: "Only volunteers can purchase subscription plans" });
    }
    
    if (!plan) {
      return res
        .status(400)
        .json({ success: false, message: "Plan is required" });
    }
    
    // Set price based on plan duration
    if (plan.duration == "3 Months") {
      price = Number(process.env.THREE_MONTH) || 749;
    } else if (plan.duration == "6 Months") {
      price = Number(process.env.SIX_MONTH) || 1099;
    } else if (plan.duration == "12 Months") {
      price = Number(process.env.TWELVE_MONTH) || 1499;
    } 

    if (coupon) {
      const codeUpper = coupon.code.toUpperCase();
      const orderAmount = Number(price);
      const now = new Date();

      validCoupon = await Coupon.findOne({
        code: codeUpper,
        isActive: true,
        minOrderValue: { $lte: orderAmount },
        usersUsed: { $ne: userId },
        $and: [
          {
            $or: [
              { expiresAt: { $exists: false } },
              { expiresAt: { $gt: now } },
            ],
          },
          {
            $or: [
              { usageLimit: { $exists: false } },
              { usageLimit: 0 },
              { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
            ],
          },
        ],
      });

      if (!validCoupon) {
        return res.status(400).json({
          success: false,
          message: "Coupon is not valid or cannot be applied",
        });
      }
      // Apply coupon discount logic here if needed
    }
    
    let total_amount = Number(price);
    if (validCoupon) {
      total_amount = Number(price) - Number(validCoupon.discountValue);
    }
    if (total_amount < 0) total_amount = 0;

    const options = {
      amount: total_amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: Math.random(Date.now()).toString(),
    };

    const paymentResponse = await instance.orders.create(options);
    console.log("payment response:", paymentResponse);

    const transaction = new Transaction({
      user: userId,
      amount: Number(price),
      coupon: validCoupon ? validCoupon.code : "",
      currency: "INR",
      finallAmount: total_amount,
      plan: plan.duration,
      razorpayOrderId: paymentResponse.id,
      status: "created",
    });
    
    await transaction.save();

    return res.status(200).json({
      success: true,
      message: "Payment order created successfully",
      paymentResponse
    });
    
  } catch (error) {
    console.error("Error in capturePayment:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to create transaction" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;
    
    console.log("verifyPayment body", req.body);
    console.log("verifyPayment user", req.user);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required payment verification data" 
      });
    }

    // Create signature for verification
    let body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");
    
    if (expectedSignature === razorpay_signature) {
      // Payment signature is valid, update transaction status
      const transaction = await Transaction.findOne({ 
        razorpayOrderId: razorpay_order_id,
        user: userId 
      });
      
      if (!transaction) {
        return res.status(404).json({ 
          success: false, 
          message: "Transaction not found" 
        });
      }
      
      // Update transaction with payment details
      transaction.razorpayPaymentId = razorpay_payment_id;
      transaction.razorpaySignature = razorpay_signature;
      transaction.status = "completed";
      transaction.paidAt = new Date();
      
      await transaction.save();
      
      // Update user subscription status
      const user = await User.findById(userId);
      if (user && user.role === 'volunteer') {
        const volunteer = await Volunteer.findOne({ user: userId });
        if (volunteer) {
          const planDuration = transaction.plan;
          const startDate = new Date();
          let endDate = new Date();
          
          // Calculate subscription end date
          if (planDuration === "3 Months") {
            endDate.setMonth(endDate.getMonth() + 3);
          } else if (planDuration === "6 Months") {
            endDate.setMonth(endDate.getMonth() + 6);
          } else if (planDuration === "12 Months") {
            endDate.setFullYear(endDate.getFullYear() + 1);
          }
          
          volunteer.subscriptionStatus = "active";
          volunteer.subscriptionPlan = planDuration;
          volunteer.subscriptionStartDate = startDate;
          volunteer.membershipExpiresAt = endDate;
          volunteer.isPaidMember = true;
          
          await volunteer.save();
        }
      }
      
      // Update coupon usage if coupon was used
      if (transaction.coupon) {
        const coupon = await Coupon.findOne({ code: transaction.coupon });
        if (coupon) {
          coupon.usedCount += 1;
          coupon.usersUsed.push(userId);
          await coupon.save();
        }
      }
      
      return res.status(200).json({ 
        success: true, 
        message: "Payment verified and subscription activated",
        data: {
          transactionId: transaction._id,
          subscriptionPlan: transaction.plan,
          amount: transaction.finallAmount
        }
      });
    }

    return res.status(400).json({ 
      success: false, 
      message: "Payment verification failed - Invalid signature" 
    });
    
  } catch (error) {
    console.error("Error in verifyPayment:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Unable to verify payment" 
    });
  }
};