const Opportunity = require("../models/Opportunity");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const cloudinary = require("cloudinary").v2;
const User = require("../models/User");
const Host=require('../models/Host')

exports.createOpportunity = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("User ID:", userId);
    const hostData = await Host.findOne({ user: userId });

    if (!hostData) {
      return res.status(404).json({ success: false, message: "Host profile not found" });
    }

    console.log("host", hostData);

    const {
      title,
      description,
      volunteerIn,
      state,
      district,
      propertyName,
      propertyAddress,
      propertyType,
      businessLink,
      volunteerNeeded,
      safeForFemale,
      location,
      roomType,
      meals,
      amenities,
      transport,
      workingHours,
      daysOff,
      minimumDuration,
      maximumDuration,
      skills,
      expectations,
      aboutLocation,
      isActive
    } = req.body;

    // Handle images - check for both 'images' and 'newImages' in req.files
    const images = req.files?.newImages || req.files?.images || [];
    const imageArray = Array.isArray(images) ? images : [images];

    if (imageArray.length === 0) {
      return res.status(400).json({ success: false, error: "At least one image is required" });
    }

    // Upload images to Cloudinary
    const uploadedImages = await Promise.all(
      imageArray.map((image) =>
        uploadImageToCloudinary(image, "opportunity", "opportunity")
      )
    );

    const opportunity = new Opportunity({
      title: title || "",
      description,
      volunteerIn,
      state,
      district,
      propertyName,
      propertyAddress,
      propertyType: Array.isArray(propertyType) ? propertyType : [propertyType],
      businessLink,
      volunteerNeeded: parseInt(volunteerNeeded),
      safeForFemale: safeForFemale === 'true' || safeForFemale === true,
      location,
      roomType: Array.isArray(roomType) ? roomType : [roomType],
      meals,
      amenities: Array.isArray(amenities) ? amenities : [amenities],
      transport: Array.isArray(transport) ? transport : [transport],
      workingHours: parseInt(workingHours),
      daysOff: parseInt(daysOff),
      minimumDuration: parseInt(minimumDuration),
      maximumDuration: maximumDuration ? parseInt(maximumDuration) : null,
      skills: Array.isArray(skills) ? skills : [skills],
      expectations,
      aboutLocation,
      images: uploadedImages.map((img) => ({
        asset_id: img.asset_id,
        public_id: img.public_id,
        url: img.secure_url || img.url,
      })),
      host: hostData._id, // Associate with the host
      isActive: isActive !== undefined ? isActive : true,
      status: isActive === false ? "inactive" : "active" // Set status based on isActive
    });

    await opportunity.save();

    // Update host's opportunitiesPosted array
    await Host.findByIdAndUpdate(
      hostData._id,
      { $push: { opportunitiesPosted: opportunity._id } }
    );

    return res.status(201).json({ 
      success: true, 
      message: "Opportunity created successfully",
      opportunity: opportunity
    });
  } catch (error) {
    console.error("createOpportunity error:", error);
    return res.status(500).json({ success: false, message: "Could not create opportunity" });
  }
};

exports.editOpportunity = async (req, res) => {
  try {
   
    console.log("files", req.files);

    const opportunityId = req.params.id;
    
    if (!opportunityId) {
      return res.status(400).json({ success: false, message: "Opportunity ID is required" });
    }

    const updates = req.body;
     console.log("editOpportunity called", updates.businessLink);

    // Parse new uploaded files - handle single file or array
    const newFiles = req.files?.newImages 
      ? Array.isArray(req.files.newImages) 
        ? req.files.newImages 
        : [req.files.newImages]
      : [];

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: "Opportunity not found" });
    }

    // Check if user owns this opportunity
    const userId = req.user.id;
    const hostData = await Host.findOne({ user: userId });
    if (!hostData || !opportunity.host.equals(hostData._id)) {
      return res.status(403).json({ success: false, message: "Not authorized to edit this opportunity" });
    }

    // ---------------- STEP 1: Handle Images ----------------
    let updatedImages = [];

    // Parse existingImages from string to array
    if (updates.existingImages) {
      try {
        const existingImagesArray = JSON.parse(updates.existingImages);
        updatedImages = existingImagesArray.map(img => ({
          asset_id: img.asset_id,
          public_id: img.public_id,
          url: img.url
        }));

        // Delete images that were removed (not in existingImages)
        const keptPublicIds = existingImagesArray.map(img => img.public_id);
        const imagesToDelete = opportunity.images.filter(img => 
          !keptPublicIds.includes(img.public_id)
        );

        // Delete from Cloudinary
        if (imagesToDelete.length > 0) {
          await Promise.all(
            imagesToDelete.map(img => 
              cloudinary.uploader.destroy(img.public_id, { resource_type: "image" })
            )
          );
        }
      } catch (parseError) {
        console.error("Error parsing existingImages:", parseError);
        // If parsing fails, keep all existing images
        updatedImages = [...opportunity.images];
      }
    } else {
      // If no existingImages provided, remove all existing images
      if (opportunity.images.length > 0) {
        await Promise.all(
          opportunity.images.map(img => 
            cloudinary.uploader.destroy(img.public_id, { resource_type: "image" })
          )
        );
      }
    }

    // Upload newly added images
    if (newFiles.length > 0) {
      const uploadedImages = await Promise.all(
        newFiles.map(file => 
          uploadImageToCloudinary(file, "opportunity", "opportunity")
        )
      );

      const newImageObjects = uploadedImages.map(img => ({
        asset_id: img.asset_id,
        public_id: img.public_id,
        url: img.secure_url || img.url,
      }));

      updatedImages = [...updatedImages, ...newImageObjects];
    }

    // ---------------- STEP 2: Update Other Fields ----------------
    const fieldsToUpdate = {
      title: updates.title,
      description: updates.description,
      volunteerIn: updates.volunteerIn,
      state: updates.state,
      district: updates.district,
      propertyName: updates.propertyName,
      propertyAddress: updates.propertyAddress,
      businessLink: updates.businessLink,
      location: updates.location,
      meals: updates.meals,
      expectations: updates.expectations,
      aboutLocation: updates.aboutLocation,
      
      // Parse numbers
      volunteerNeeded: parseInt(updates.volunteerNeeded),
      workingHours: parseInt(updates.workingHours),
      daysOff: parseInt(updates.daysOff),
      minimumDuration: parseInt(updates.minimumDuration),
      maximumDuration: updates.maximumDuration ? parseInt(updates.maximumDuration) : null,
      
      // Parse boolean
      safeForFemale: updates.safeForFemale === 'true' || updates.safeForFemale === true,
      isActive: updates.isActive === 'true' || updates.isActive === true,
      
      // Parse JSON arrays
      propertyType: JSON.parse(updates.propertyType || '[]'),
      roomType: JSON.parse(updates.roomType || '[]'),
      amenities: JSON.parse(updates.amenities || '[]'),
      transport: JSON.parse(updates.transport || '[]'),
      skills: JSON.parse(updates.skills || '[]'),
      
      // Update images
      images: updatedImages
    };

    // Set status based on isActive
    fieldsToUpdate.status = fieldsToUpdate.isActive ? "active" : "inactive";
    // console.log("fieldsToUpdate", fieldsToUpdate);
    // Update the opportunity
    const updatedOpportunity = await Opportunity.findByIdAndUpdate(
      opportunityId,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Opportunity updated successfully",
      opportunity: updatedOpportunity,
    });

  } catch (error) {
    console.error("editOpportunity error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Unable to edit opportunity",
      error: error.message 
    });
  }
};

// exports.removeOpportunity = async (req, res) => {
//   try {
//     const opportunityId = req.params.id;

//     const opportunity = await Opportunity.findById(opportunityId);
//     if (!opportunity) {
//       return res.status(404).json({ success: false, message: "Opportunity not found" });
//     }

//     opportunity.isActive = false; // Soft delete
//     opportunity.status = "inactive"; // Update status
//     await opportunity.save();

//     return res.status(200).json({ success: true, message: "Opportunity removed successfully" });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };


exports.getOpportunityById = async (req, res) => {
  try {
    const opportunityId = req.params.id;

    const opportunity = await Opportunity.findById(opportunityId).select("-applications")
      .populate({
      path: "host",
      select: "user designation organizationName organizationType needOfVolunteer bio opportunitiesPosted",
      populate: {
        path: "user",
        select: "firstName lastName profilePicture"
      }
      });
    if (!opportunity) {
      return res.status(404).json({ success: false, message: "Opportunity not found" });
    }
    console.log("Fetched opportunity:", opportunity);
    return res.status(200).json({ success: true, opportunity });
  } catch (error) {
    console.error("Error fetching opportunity:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getHostOpportunity=async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("host");

    const opportunities = await Opportunity.find({ host: user.host })
    console.log("opp",opportunities)
    return res.status(200).json({ success: true, opportunities });
  } catch (error) {
    console.error("Error fetching host opportunities:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAllOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ status: "active", isActive: true })
      .select("-propertyAddress -businessLink -applications")
      .populate({
      path: "host",
      select: "user designation organizationName organizationType needOfVolunteer bio opportunitiesPosted",
      populate: {
        path: "user",
        select: "firstName lastName profilePicture"
      }
      })
      .sort({ createdAt: -1 });

    if(!opportunities || opportunities.length===0){
      return res.status(404).json({ success: false, message: "No opportunities found" });
    }
    return res.status(200).json({ success: true, opportunities });
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return res.status(500).json({ success: false, message: "Unable to fetch opportunities" });
  }
}

//GET /api/opportunities?states=Odisha,Himachal Pradesh&skills=chef,web dev&page=2&limit=12&sortBy=createdAt&order=asc
exports.getOpportunities = async (req, res) => {
  try {
    let { states, skills, page = 1, limit = 10, sortBy = "createdAt", order = "desc" } = req.query;

    // Convert query params (CSV -> array)
    states = states ? states.split(",") : [];
    skills = skills ? skills.split(",") : [];

    // Build query
    const query = {
      status: "active",
      isActive: true,
    };
    if (states.length > 0) query.state = { $in: states };
    if (skills.length > 0) query.skills = { $in: skills };

    // Pagination
    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.max(parseInt(limit) || 10, 1);
    const skip = (page - 1) * limit;

    // Sorting
    const sortOrder = order === "asc" ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Fetch opportunities + total count in parallel
    const [opportunities, total] = await Promise.all([
      Opportunity.find(query)
        .select("-propertyAddress -propertyName -businessLink") // exclude fields
        .populate({
          path: "host",
          select: "bio user", // only include bio + user reference
          populate: {
            path: "user",
            select: "firstName lastName profilePicture" // only these fields
          }
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Opportunity.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: opportunities,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        pageSize: limit,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getOpportunitiesForAdmin = async (req, res) => {
  try{
    const{ email} =req.body
    const user=await User.findOne({email}).populate("role")
    if(!user){
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    const opportunities = await Opportunity.find({ host: user.host });
    return res.status(200).json({ success: true, opportunities });
  }
  catch(error){
    console.error("Error fetching opportunities for admin:", error);
    return res.status(500).json({ success: false, message: "Unable to fetch opportunities for admin" });
  }
}