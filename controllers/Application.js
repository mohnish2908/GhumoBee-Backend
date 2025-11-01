const Application = require("../models/Application");
const Volunteer = require("../models/Volunteer");
const User = require("../models/User");
const Opportunity = require("../models/Opportunity");
const Host = require("../models/Host");

/**
 * @desc Create a new application
 */
exports.createApplication = async (req, res) => {
  const userId = req.user.id;
  const { opportunity, startDate, endDate, message, coverLetter } = req.body;

  try {
    console.log("Creating application with data:", req.body);
    // Validate user
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    //check user is availabel for volunteering
    const volunteer = await Volunteer.findOne({ user: userId });

    if (!volunteer) {
      return res
        .status(404)
        .json({ success: false, message: "Volunteer profile not found" });
    }
    console.log("Volunteer details:", volunteer);
    if (!volunteer.available) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "You are not available for volunteering currently. You are volunteering in some other opportunity.",
        });
    }

    //check user has already applied for this opportunity
    const existingApplication = await Application.find({
      user: userId,
      opportunity,
    });

    if (existingApplication.length > 0) {
      existingApplication.forEach((app) => {
        if (
          app.status === "pending" ||
          app.status === "shortlisted" ||
          app.status === "volunteering"
        ) {
          return res
            .status(403)
            .json({
              success: false,
              message:
                "You have already applied for this opportunity and your application is still under review or active.",
            });
        }
      });
    }

    // Create application
    const application = new Application({
      user: userId,
      opportunity,
      startDate,
      endDate,
      message,
      coverLetter,
    });

    await application.save();
    res
      .status(201)
      .json({
        success: true,
        message: "Application created successfully",
        application,
      });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Application already exists for this opportunity",
        });
    }
    console.error("Error creating application:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @desc Edit an existing application
 */
exports.editApplication = async (req, res) => {
  const userId = req.user.id;
  const { applicationId } = req.params;
  const { startDate, endDate, message, coverLetter, status } = req.body;

  try {
    const application = await Application.findOne({
      _id: applicationId,
      user: userId,
    });
    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    if (application.status !== "pending") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Only pending applications can be edited.",
        });
    }

    // Update fields if provided
    if (startDate) application.startDate = startDate;
    if (endDate) application.endDate = endDate;
    if (message) application.message = message;
    if (coverLetter) application.coverLetter = coverLetter;
    if (status) application.status = status;

    await application.save();
    res
      .status(200)
      .json({
        success: true,
        message: "Application updated successfully",
        application,
      });
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @desc Get applications
 * - Volunteer: fetches all applications of logged-in user
 * - Host/Admin: can fetch applications for a given opportunity
 */
exports.getApplications = async (req, res) => {
  const userId = req.user.id;
  const { opportunityId } = req.query; // optional filter for hosts/admins

  try {
    let applications;

    if (req.user.role === "volunteer") {
      // Volunteer → fetch own applications
      applications = await Application.find({ user: userId })
        .populate("opportunity", "title location") // populate opportunity basic info
        .sort({ submittedAt: -1 });
    } else if (req.user.role === "host" && opportunityId) {
      // Host → fetch applications for their opportunity
      applications = await Application.find({ opportunity: opportunityId })
        .populate("user", "firstName lastName email") // populate volunteer info
        .sort({ submittedAt: -1 });
    } else if (req.user.role === "admin") {
      // Admin → fetch all applications (optional filter)
      const filter = opportunityId ? { opportunity: opportunityId } : {};
      applications = await Application.find(filter)
        .populate("user", "firstName lastName email")
        .populate("opportunity", "title location")
        .sort({ submittedAt: -1 });
    } else {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized to view applications" });
    }

    res.status(200).json({ success: true, applications });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// exports.getApplicationById = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { applicationId } = req.params;

//     const application = await Application.findById(applicationId)
//       .populate("user", "firstName lastName email")
//       .populate("opportunity", "title location description");

//     if (!application) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Application not found" });
//     }

//     // Check if the user is authorized to view the application
//     if (
//       req.user.role === "volunteer" &&
//       application.user._id.toString() !== userId
//     ) {
//       return res
//         .status(403)
//         .json({
//           success: false,
//           message: "Unauthorized to view this application",
//         });
//     }

//     res.status(200).json({ success: true, application });
//   } catch (error) {
//     console.error("Error fetching application:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

//GET /api/v1/applications/volunteer?page=1&status=pending (If you want to filter by status)
// GET /api/v1/applications/volunteer?page=1 (If you want all applications)
exports.getVolunteerSideApplications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const status =
      typeof req.query.status === "string" ? req.query.status : null;
    const LIMIT = 5;
    const skip = (page - 1) * LIMIT;

    if (!userId || req.user.role !== "volunteer") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const filters = { user: userId };
    if (status) {
      filters.status = status; // omit ?status= to fetch all
    }

    const [applications, total] = await Promise.all([
      Application.find(filters)
        .populate("opportunity", "title location startDate endDate host")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(LIMIT),
      Application.countDocuments(filters),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit: LIMIT,
          total,
          totalPages: Math.ceil(total / LIMIT) || 1,
          hasNextPage: skip + applications.length < total,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching volunteer side applications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//GET /api/v1/applications/host?page=1&status=&opportunityId=
// exports.getHostSideApplications = async (req, res) => {
//   try {
//     const userId = req.user?.id;
//     const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
//     const status = typeof req.query.status === "string" ? req.query.status : null;
//     const opportunityId = typeof req.query.opportunityId === "string" ? req.query.opportunityId : null;
//     const LIMIT = 5;
//     const skip = (page - 1) * LIMIT;

//     if (!userId || req.user.role !== "host") {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     const filters = {};
//     if (opportunityId) {
//       filters.opportunity = opportunityId;
//     }
//     if (status) {
//       filters.status = status;
//     }

//     const [applications, total] = await Promise.all([
//       Application.find(filters)
//         .populate("user", "name email")
//         .populate("opportunity", "title")
//         .sort({ submittedAt: -1 })
//         .skip(skip)
//         .limit(LIMIT),
//       Application.countDocuments(filters),
//     ]);

//     // Filter applications where the host owns the opportunity
//     const filteredApplications = applications.filter(
//       app => app.opportunity?.host?.toString() === userId
//     );
//     const filteredTotal = filteredApplications.length;
//     console.log("aa",filteredApplications)
//     return res.status(200).json({
//       success: true,
//       data: {
//         applications: filteredApplications,
//         pagination: {
//           page,
//           limit: LIMIT,
//           total: filteredTotal,
//           totalPages: Math.ceil(filteredTotal / LIMIT) || 1,
//           hasNextPage: skip + filteredApplications.length < filteredTotal,
//           hasPrevPage: page > 1,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching host side applications:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

exports.getHostSideApplications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const status =
      typeof req.query.status === "string" && req.query.status !== ""
        ? req.query.status
        : null;
    const opportunityId =
      typeof req.query.opportunityId === "string" &&
      req.query.opportunityId !== ""
        ? req.query.opportunityId
        : null;
    const LIMIT = 5;
    const skip = (page - 1) * LIMIT;

    if (!userId || req.user.role !== "host") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ✅ Step 1: Find the host document for this user

    const host = await Host.findOne({ user: userId });

    if (!host) {
      return res
        .status(404)
        .json({ success: false, message: "Host profile not found" });
    }

    // ✅ Step 2: Get all opportunity IDs owned by this host
    const hostOpportunities = await Opportunity.find({ host: host._id }).select(
      "_id"
    );
    const hostOpportunityIds = hostOpportunities.map((o) => o._id);

    if (hostOpportunityIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          applications: [],
          pagination: {
            page,
            limit: LIMIT,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      });
    }

    // ✅ Step 3: Build filters
    const filters = {};

    // If opportunityId is provided, filter by that specific opportunity
    // Otherwise, filter by all host's opportunities
    if (opportunityId) {
      filters.opportunity = opportunityId;
    } else {
      filters.opportunity = { $in: hostOpportunityIds };
    }

    // Add status filter only if provided
    if (status) {
      filters.status = status;
    }

    // ✅ Step 4: Fetch paginated applications
    const [applications, total] = await Promise.all([
      Application.find(filters)
        .populate("user", "name email")
        .populate("opportunity", "title")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(LIMIT),
      Application.countDocuments(filters),
    ]);

    // ✅ Step 5: Return response
    return res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit: LIMIT,
          total,
          totalPages: Math.ceil(total / LIMIT) || 1,
          hasNextPage: skip + applications.length < total,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching host side applications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


exports.getApplicationById =async (req,res)=>{
  try{
    const {applicationId}=req.params;
     if(!applicationId){
      return res.status(400).json({success:false,message:"Application ID is required"});
     }
    const application = await Application.findById(applicationId)
      .populate({
        path: "user",
        select: "-password -aadhaarDoc",
        populate: {
          path: "volunteer", // ✅ Nested populate to get volunteer details
          model: "Volunteer",
          select: "-profileCompletion -isPaidMember -subscriptionStatus -subscriptionPlan -subscriptionStartDate -membershipExpiresAt" 
        }
      })
      .populate("opportunity");

      return res.status(200).json({success:true,application}); 
  }
  catch(err){
    console.error("Error fetching application:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch application backend" });
  }
}