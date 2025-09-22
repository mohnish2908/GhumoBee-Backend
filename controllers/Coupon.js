const Coupon = require("../models/Coupon");
const User = require("../models/User");

// Create a new coupon (Admin only)
exports.createCoupon = async (req, res) => {
  try {
    console.log("Request body of coupon createing:", req.body); 
    const {
      code,
      description,
      discountValue,
      minOrderValue,
      usageLimit,
      expiresAt,
      isActive = true
    } = req.body;

    // Validate required fields
    if (!code || discountValue == null) {
      return res.status(400).json({
        success: false,
        message: "Code and discount value are required"
      });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists"
      });
    }

    // Create new coupon
    const newCoupon = await Coupon.create({
      code: code.toUpperCase(),
      description: description || "",
      discountValue,
      minOrderValue: minOrderValue || 0,
      usageLimit,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: newCoupon
    });

  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create coupon"
    });
  }
};

// Get all coupons with filters (Admin only)
exports.getAllCoupons = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Apply filters
    if (status) {
      if (status === 'active') {
        const now = new Date();
        query.isActive = true;
        query.$or = [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: now } }
        ];
      } else if (status === 'inactive') {
        query.isActive = false;
      } else if (status === 'expired') {
        query.expiresAt = { $lt: new Date() };
      }
    }

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const coupons = await Coupon.find(query)
      .populate('createdBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalCoupons = await Coupon.countDocuments(query);

    res.status(200).json({
      success: true,
      data: coupons,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCoupons / limit),
        totalCoupons,
        hasNextPage: page * limit < totalCoupons,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch coupons"
    });
  }
};

// Get single coupon by ID (Admin only)
exports.getCouponById = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId)
      .populate('createdBy', 'name email')
      .populate('usersUsed', 'name email');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }

    res.status(200).json({
      success: true,
      data: coupon
    });

  } catch (error) {
    console.error("Error fetching coupon:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch coupon"
    });
  }
};

// Update coupon (Admin only)
exports.updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.createdBy;
    delete updateData.usedCount;
    delete updateData.usersUsed;

    // If updating code, check for duplicates
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
      const existingCoupon = await Coupon.findOne({ 
        code: updateData.code,
        _id: { $ne: couponId }
      });
      
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: "Coupon code already exists"
        });
      }
    }

    // Convert expiresAt to Date if provided
    if (updateData.expiresAt) {
      updateData.expiresAt = new Date(updateData.expiresAt);
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!updatedCoupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: updatedCoupon
    });

  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update coupon"
    });
  }
};

// Soft delete coupon (Admin only) - Set isActive to false
exports.deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }

    // Soft delete by setting isActive to false
    coupon.isActive = false;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: "Coupon deleted (deactivated) successfully"
    });

  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete coupon"
    });
  }
};

// Validate coupon for user (Public - for checkout)
exports.validateCoupon = async (req, res) => {
  try {
    const { couponCode, orderAmount } = req.body;
    const userId=req.user.id;


    if (!couponCode || !orderAmount) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and order amount are required"
      });
    }

    const now = new Date();
    const codeUpper = couponCode.toUpperCase().trim();

    // Find the coupon with all validations
    const coupon = await Coupon.findOne({
      code: codeUpper,
      isActive: true,
      minOrderValue: { $lte: orderAmount },
      usersUsed: { $ne: userId},
      $and: [
        // Expiration check
        { $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] },
        // Usage limit check  
        { $or: [
            { usageLimit: { $exists: false } },
            { usageLimit: 0 },
            { $expr: { $lt: ["$usedCount", "$usageLimit"] } }
          ]
        }
      ]
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code or coupon not applicable"
      });
    }

    // Calculate discount (fixed amount)
    const discountAmount = Math.min(coupon.discountValue, orderAmount);

    res.status(200).json({
      success: true,
      message: "Coupon is valid",
      data: {
        couponId: coupon._id,
        couponCode: coupon.code,
        description: coupon.description,
        discountValue: coupon.discountValue,
        discountAmount,
        finalAmount: orderAmount - discountAmount,
        savings: discountAmount
      }
    });

  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate coupon"
    });
  }
};