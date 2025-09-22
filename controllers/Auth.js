const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Host = require("../models/Host");
const Volunteer = require("../models/Volunteer");
const Otp = require("../models/Otp");
const mailSender = require("../utils/mailSender");
const { forgotPasswordMail } = require("../mails/forgotPasswordMail");
const {uploadImageToCloudinary} =require("../utils/imageUploader")
require("dotenv").config();

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2️⃣ Find user by email
    const user = await User.findOne({ email }).populate('host').populate('volunteer');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 4️⃣ Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "3d",
      }
    );

    // 5️⃣ Prepare response: send essential info only
    const userResponse = {
      _id: user._id,
      name: user.name || "",
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture || null,
      city: user.city || "",
      state: user.state || "",
      isVerified: user.isVerified,
      volunteer: user.volunteer || null,
    };
    // console.log("User logged in:", userResponse);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// exports.sendOTP = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }
//     const otp = otpGenerator.generate(6, {
//       upperCase: false,
//       specialChars: false,
//     });
//     await Otp.create({ email, otp });
//     // Send OTP to user's email
//     const emailBody = forgotPasswordMail(otp);
//     await mailSender(email, "Your OTP for GhumoBee", emailBody);

//     return res.status(200).json({ success: true, message: "OTP sent successfully" });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

exports.createUser = async (req, res) => {
  try {
    const { name,email, password, confirmPassword, role,key } = req.body;
    // console.log("a", req.body);
    const user = await User.find({ email });
    if (password != confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }
    if (user.length > 0) {
      // console.log("asdfasdf", user);
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // console.log("hashedPassword", hashedPassword);

    if(role==="admin" && key!=='mohnishpulkit@123'){
      return res.status(400).json({success:false,message:"Cannot create admin without proper key"})
    }

    const newUser = await User.create({
      name,
      email,
      role,
      password: hashedPassword,
    });
    // console.log("newUser", newUser);
    if (role === "host") {
      const host = await Host.create({ user: newUser._id });
      newUser.host = host._id; // link host back to user
      await newUser.save();
    } else if (role === "volunteer") {
      const volunteer = await Volunteer.create({ user: newUser._id });
      newUser.volunteer = volunteer._id; // link volunteer back to user
      await newUser.save();
    }
    return res.status(201).json({
      message: "User created successfully",
      user: newUser,
      success: true,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res
      .status(500)
      .json({ message: "Unable to create User", success: false, error: error.message });
  }
};

exports.editUser = async (req, res) => {
  try {
    // console.log("Edit user request received");
    // console.log("Body:", req.body);
    // console.log("Files:", req.files ? Object.keys(req.files) : "No files");
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        const file = req.files[key];
        console.log(`File ${key}:`, {
          name: file.name,
          size: file.size,
          mimetype: file.mimetype,
          hasData: !!file.data,
          dataLength: file.data ? file.data.length : 0,
          tempFilePath: file.tempFilePath || 'No temp file path'
        });
      });
    }

    const userId = req.user.id; // or req.user.id from auth middleware
    const {
      name,
      phone,
      emergencyContactNumber,
      emergencyContactPersonName,
      dob,
      gender,
      address,
      city,
      state,
      country,
      pincode,
    } = req.body;

    // Handle languages - check for both 'languages' and 'languages[]'
    const languages = req.body.languages || req.body['languages[]'];

    // Check if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate date of birth
    if (dob) {
      const dobDate = new Date(dob);
      const today = new Date();
      const age = today.getFullYear() - dobDate.getFullYear();

      if (age < 16) {
        return res.status(400).json({
          success: false,
          message: "User must be at least 16 years old",
        });
      }
    }

    // Build update object with only provided fields
    const updateFields = {};

    if (name) updateFields.name = name.trim();
    if (phone) updateFields.phone = phone.trim();
    if (emergencyContactNumber)
      updateFields.emergencyContactNumber = emergencyContactNumber.trim();
    if (emergencyContactPersonName)
      updateFields.emergencyContactPersonName = emergencyContactPersonName.trim();
    if (dob) updateFields.dob = new Date(dob);
    if (gender) updateFields.gender = gender;
    
    // Handle languages array - it might come as a string or array
    if (languages) {
      if (Array.isArray(languages)) {
        updateFields.languages = languages;
      } else if (typeof languages === 'string') {
        try {
          // Try to parse as JSON if it's a string
          updateFields.languages = JSON.parse(languages);
        } catch (e) {
          // If not JSON, treat as comma-separated string
          updateFields.languages = languages.split(',').map(lang => lang.trim());
        }
      }
      // console.log("Languages processed:", updateFields.languages);
    }
    
    if (address) updateFields.address = address.trim();
    if (city) updateFields.city = city.trim();
    if (state) updateFields.state = state.trim();
    if (country) updateFields.country = country.trim();
    if (pincode) updateFields.pincode = pincode.trim();

    // Handle profile picture upload
    if (req.files && req.files.profilePicture) {
      try {
        const file = req.files.profilePicture;
        // console.log("Uploading profile picture:", file.name);
        
        // Check if file has data or temp file path
        if ((!file.data || file.data.length === 0) && !file.tempFilePath) {
          console.error("Profile picture file data is empty and no temp file path");
          return res.status(400).json({
            success: false,
            message: "Profile picture file data is empty",
          });
        }
        
        const profilePicture = await uploadImageToCloudinary(
          file,
          "profile_pictures",
          "profile"
        );
        updateFields.profilePicture = {
          asset_id: profilePicture.asset_id,
          public_id: profilePicture.public_id,
          url: profilePicture.secure_url,
        };
        // console.log("Profile picture uploaded successfully:", profilePicture.secure_url);
      } catch (uploadError) {
        console.error("Profile picture upload error:", uploadError);
        return res.status(400).json({
          success: false,
          message: "Error uploading profile picture: " + uploadError.message,
        });
      }
    }

    // Handle aadhaar document upload
    if (req.files && req.files.aadhaarDoc) {
      try {
        const file = req.files.aadhaarDoc;
        // console.log("Uploading aadhaar document:", file.name);
        
        // Check if file has data or temp file path
        if ((!file.data || file.data.length === 0) && !file.tempFilePath) {
          console.error("Aadhaar document file data is empty and no temp file path");
          return res.status(400).json({
            success: false,
            message: "Aadhaar document file data is empty",
          });
        }
        
        const aadhaarDoc = await uploadImageToCloudinary(
          file,
          "aadhaar_documents",
          "document"
        );
        updateFields.aadhaarDoc = aadhaarDoc.secure_url;
        // console.log("Aadhaar document uploaded successfully:", aadhaarDoc.secure_url);
      } catch (uploadError) {
        console.error("Aadhaar document upload error:", uploadError);
        return res.status(400).json({
          success: false,
          message: "Error uploading Aadhaar document: " + uploadError.message,
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validations
      }
    ).select("-password"); // Exclude password from response

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user:", err);

    return res.status(500).json({ 
      success: false, 
      message: "Unable to update User",
      error: err.message 
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { email, password, confirmPassword, otp } = req.body;
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const otpStored = await Otp.findOne({ email }).sort({ createdAt: -1 });
    if (!otpStored || otpStored.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    user.password = hashedPassword;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Unable to change password" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.find({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    // generate otp
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
      digits: true,
    });

    // console.log("aaaaaa", otp);
    const mailContent = forgotPasswordMail(otp);
    await mailSender(email, "Forgot Password", mailContent);

    await Otp.create({ email, otp });

    return res
      .status(200)
      .json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Unable to reset password" });
  }
};

exports.verifyUser = async (req, res) => {
  try{
    const { email, isVerified } = req.body;
    const user=await User.findOne({ email });
    if(!user){
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }
    user.isVerified=isVerified;
    await user.save();
    return res.status(200).json({
        success: true,
        message: "User verification status updated successfully",
        data: user
    });
  }
  catch(err){
    return res.status(500).json({
      success: false,
      message: "Could not verify user",
      error: err.message
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    // Handle both authenticated requests (via middleware) and email-based requests
    let user;
    const { email } = req.body;
    
    if (email) {
      // Email-based lookup (for frontend profile pages)
      user = await User.findOne({ email })
        .populate({
          path: 'volunteer',
          // select: 'skills bio socialLinks achievements education profileCompletion isProfileComplete'
        })
        .populate({
          path: 'host',
          // select: 'designation organizationName organizationType needOfVolunteer businessDocument bio profileCompletion isPaidHost socialLinks'
        })
        .select('-password');
    } else if (req.user && req.user.id) {
      // Authenticated request via middleware
      user = await User.findById(req.user.id)
        .populate({
          path: 'volunteer',
          // select: 'skills bio socialLinks achievements education profileCompletion isProfileComplete'
        })
        .populate({
          path: 'host',
          // select: 'designation organizationName organizationType needOfVolunteer businessDocument bio profileCompletion isPaidHost socialLinks'
        })
        .select('-password');
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Email or authentication required" 
      });
    }

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Log for debugging
    console.log('getUser response:', {
      userId: user._id,
      email: user.email,
      role: user.role,
      hasVolunteer: !!user.volunteer,
      hasHost: !!user.host
    });

    return res.status(200).json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    console.error("Error getting user:", error);
    return res
      .status(500)
      .json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
  }
};

// Admin Functions
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Add role filter if specified
    if (role) {
      searchQuery.role = role;
    }

    // Get users with pagination
    const users = await User.find(searchQuery)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalUsers = await User.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalUsers / limitNum);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalUsers,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Error getting all users:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password')
      .populate('host')
      .populate('volunteer');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

exports.adminVerifyUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { isVerified: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "User verified successfully",
      data: user
    });
  } catch (error) {
    console.error("Error verifying user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Search user by email with complete information
exports.searchUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Find user with exact email match and populate related data
    const user = await User.findOne({ 
      email: email.toLowerCase()
    })
    .select('-password')
    .populate({
      path: 'host',
    })
    .populate({
      path: 'volunteer',
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email"
      });
    }

    // console.log("Found user:", user.name, "Role:", user.role);

    // If user is a host, fetch their opportunities
    let hostOpportunities = [];
    if ((user.role === 'Host' || user.role === 'host') && user.host) {
      try {
        const Opportunity = require("../models/Opportunity");
        hostOpportunities = await Opportunity.find({ host: user.host._id })
          .select('title description location accommodationType maxVolunteers currentVolunteers isActive createdAt updatedAt')
          .sort({ createdAt: -1 });
        
        console.log(`Found ${hostOpportunities.length} opportunities for host`);
      } catch (oppError) {
        console.error("Error fetching opportunities:", oppError);
        hostOpportunities = [];
      }
    }

    // If user is a volunteer, fetch their applications
    let volunteerApplications = [];
    if ((user.role === 'Volunteer' || user.role === 'volunteer') && user.volunteer) {
      try {
        const Application = require("../models/Application");
        volunteerApplications = await Application.find({ volunteer: user.volunteer._id })
          .populate({
            path: 'opportunity',
            select: 'title location host',
            populate: {
              path: 'host',
              select: 'user',
              populate: {
                path: 'user',
                select: 'name email'
              }
            }
          })
          .select('status appliedDate message')
          .sort({ appliedDate: -1 });
        
        console.log(`Found ${volunteerApplications.length} applications for volunteer`);
      } catch (appError) {
        console.error("Error fetching applications:", appError);
        volunteerApplications = [];
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        user,
        hostOpportunities: hostOpportunities || [],
        volunteerApplications: volunteerApplications || []
      },
      message: "User found successfully"
    });
  } catch (error) {
    console.error("Error searching user by email:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};