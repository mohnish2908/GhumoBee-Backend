const Host = require("../models/Host");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

exports.updateHostProfile = async (req, res) => {
  try {
    const  userId  = req.user.id; // From auth middleware
    
    console.log("Update host profile request received");
    console.log("Body:", req.body);
    console.log("Files:", req.files ? Object.keys(req.files) : []);

    // Extract and process form data
    const {
      organizationName,
      bio,
      profileCompletion,
      // isPaidHost
    } = req.body;

    // Process arrays from form data
    const designation = [];
    const organizationType = [];
    const needOfVolunteer = [];
    const socialLinks = {
      instagram: req.body['socialLinks[instagram]'] || '',
      linkedin: req.body['socialLinks[linkedin]'] || '',
      website: req.body['socialLinks[website]'] || ''
    };

    // Extract designation array
    let i = 0;
    while (req.body[`designation[${i}]`]) {
      designation.push(req.body[`designation[${i}]`]);
      i++;
    }

    // Extract organizationType array
    i = 0;
    while (req.body[`organizationType[${i}]`]) {
      organizationType.push(req.body[`organizationType[${i}]`]);
      i++;
    }

    // Extract needOfVolunteer array
    i = 0;
    while (req.body[`needOfVolunteer[${i}]`]) {
      needOfVolunteer.push(req.body[`needOfVolunteer[${i}]`]);
      i++;
    }

    console.log("Processed arrays:", {
      designation,
      organizationType,
      needOfVolunteer,
      socialLinks
    });

    // Build update object
    const updateFields = {};
    
    if (organizationName) updateFields.organizationName = organizationName.trim();
    if (bio) updateFields.bio = bio.trim();
    if (profileCompletion !== undefined) updateFields.profileCompletion = profileCompletion === 'true';
    // if (isPaidHost !== undefined) updateFields.isPaidHost = isPaidHost === 'true';
    
    if (designation.length > 0) updateFields.designation = designation;
    if (organizationType.length > 0) updateFields.organizationType = organizationType;
    if (needOfVolunteer.length > 0) updateFields.needOfVolunteer = needOfVolunteer;
    updateFields.socialLinks = socialLinks;

    // Handle business document upload
    if (req.files && req.files.businessDocument) {
      try {
        const file = req.files.businessDocument;
        console.log("Uploading business document:", file.name);
        
        // Upload to Cloudinary
        const businessDoc = await uploadImageToCloudinary(
          file,
          "business_documents",
          "document"
        );
        
        updateFields.businessDocument = businessDoc.secure_url;
        console.log("Business document uploaded successfully:", businessDoc.secure_url);
      } catch (uploadError) {
        console.error("Business document upload error:", uploadError);
        return res.status(400).json({
          success: false,
          message: "Error uploading business document: " + uploadError.message,
        });
      }
    }

    console.log("Update fields:", updateFields);

    // Find and update the host
    const updatedHost = await Host.findOneAndUpdate(
      { user: userId },
      { $set: updateFields },
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validations
      }
    ).populate('user', '-password'); // Populate user data but exclude password

    // if (!updatedHost) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Host profile not found",
    //   });
    // }

    res.status(200).json({
      success: true,
      message: "Host profile updated successfully",
    //   data: updatedHost,
    });

  } catch (err) {
    console.error("Error updating host profile:", err);
    return res.status(500).json({
      success: false,
      message: "Unable to update host profile",
      error: err.message,
    });
  }
};

exports.getHostProfile = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const host=await Host.findOne({ user: userId });
    if(!host){
        return res.status(404).json({
            success: false,
            message: "Host profile not found",
        });
    }
    return res.status(200).json({
      success: true,
      message: "Host profile fetched successfully",
      data: host
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch host profile",
      error: err.message,
    });
  }
}