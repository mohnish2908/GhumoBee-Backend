const Volunteer = require("../models/Volunteer");

exports.editVolunteer = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Edit volunteer request received");
    console.log("Body:", req.body);

    const {
      bio,
      achievements,
      bloodGroup,
      medicalComplication,
      smoke,
      alcohol,
      portfolio,
      profileCompletion,
      // isPaidMember,
      available,
      skills,
      socialLinks
    } = req.body;

    // Build update object with only provided fields
    const updateFields = {};

    if (bio !== undefined) updateFields.bio = bio.trim();
    if (achievements !== undefined) updateFields.achievements = achievements.trim();
    if (bloodGroup !== undefined) updateFields.bloodGroup = bloodGroup.trim();
    if (medicalComplication !== undefined) updateFields.medicalComplication = medicalComplication.trim();
    if (smoke !== undefined) updateFields.smoke = smoke;
    if (alcohol !== undefined) updateFields.alcohol = alcohol;
    if (portfolio !== undefined) updateFields.portfolio = portfolio.trim();
    if (profileCompletion !== undefined) updateFields.profileCompletion = profileCompletion === 'true' || profileCompletion === true;
    // if (isPaidMember !== undefined) updateFields.isPaidMember = isPaidMember === 'true' || isPaidMember === true;
    if (available !== undefined) updateFields.available = available === 'true' || available === true;

    // Handle skills array
    if (skills && Array.isArray(skills)) {
      updateFields.skills = skills.map(skill => ({
        skillName: skill.skillName ? skill.skillName.trim() : "",
        proficiencyLevel: skill.proficiencyLevel || "",
        description: skill.description ? skill.description.trim() : "",
        portfolioLink: skill.portfolioLink ? skill.portfolioLink.trim() : "",
        yearOfExperience: skill.yearOfExperience ? skill.yearOfExperience.toString().trim() : ""
      }));
    }

    // Handle social links
    if (socialLinks) {
      updateFields.socialLinks = {
        instagram: socialLinks.instagram ? socialLinks.instagram.trim() : "",
        linkedin: socialLinks.linkedin ? socialLinks.linkedin.trim() : "",
        website: socialLinks.website ? socialLinks.website.trim() : ""
      };
    }

    console.log("Update fields:", updateFields);

    // Find and update the volunteer
    const volunteer = await Volunteer.findOneAndUpdate(
      { user: userId },
      { $set: updateFields },
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validations
      }
    ).populate('user', '-password'); // Populate user data but exclude password

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer profile not found",
      });
    }

    console.log("Volunteer updated successfully:", volunteer._id);

    return res.status(200).json({
      success: true,
      message: "Volunteer updated successfully",
      data: volunteer
    });

  } catch (error) {
    console.error("Error updating volunteer:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update volunteer",
      error: error.message
    });
  }
};

exports.getVolunteerProfile = async (req, res) => {
  try{
    const userId = req.user.id; // From auth middleware 
    const volunteer=await Volunteer.findOne({ user: userId });
    if(!volunteer){
        return res.status(404).json({
            success: false,
            message: "Volunteer profile not found",
        });
    }
    return res.status(200).json({
      success: true,
      message: "Volunteer profile fetched successfully",
      data: volunteer
    });
  }
  catch(err){
    return res.status(500).json({
      success: false,
      message: "Unable to fetch volunteer profile",
      error: err.message,
    });
  } 
}

// Get volunteer subscription status
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const volunteer = await Volunteer.findOne({ user: userId });
    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer profile not found"
      });
    }
    
    const now = new Date();
    let subscriptionStatus = volunteer.subscriptionStatus;
    
    // Check if subscription has expired
    if (volunteer.membershipExpiresAt && volunteer.membershipExpiresAt < now && subscriptionStatus === 'active') {
      volunteer.subscriptionStatus = 'expired';
      volunteer.isPaidMember = false;
      await volunteer.save();
      subscriptionStatus = 'expired';
    }
    
    return res.status(200).json({
      success: true,
      message: "Subscription status fetched successfully",
      data: {
        subscriptionStatus,
        subscriptionPlan: volunteer.subscriptionPlan,
        subscriptionStartDate: volunteer.subscriptionStartDate,
        membershipExpiresAt: volunteer.membershipExpiresAt,
        isPaidMember: volunteer.isPaidMember,
        daysRemaining: volunteer.membershipExpiresAt ? 
          Math.max(0, Math.ceil((volunteer.membershipExpiresAt - now) / (1000 * 60 * 60 * 24))) : 0
      }
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch subscription status",
      error: error.message
    });
  }
}; 