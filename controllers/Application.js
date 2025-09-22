const Application = require("../models/Application");
const User = require("../models/User");



/**
 * @desc Create a new application
 */
exports.createApplication = async (req, res) => {
  const userId = req.user.id;
  const { opportunity, from, to, message, coverLetter } = req.body;

  try {
    // Validate user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Create application
    const application = new Application({
      user: userId,
      opportunity,
      from,
      to,
      message,
      coverLetter,
    });

    await application.save();
    res.status(201).json({ success: true, message: "Application created successfully", application });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Application already exists for this opportunity" });
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
  const { from, to, message, coverLetter, status } = req.body;

  try {
    const application = await Application.findOne({ _id: applicationId, user: userId });
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    // Update fields if provided
    if (from) application.from = from;
    if (to) application.to = to;
    if (message) application.message = message;
    if (coverLetter) application.coverLetter = coverLetter;
    if (status) application.status = status;

    await application.save();
    res.status(200).json({ success: true, message: "Application updated successfully", application });
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
      return res.status(403).json({ success: false, message: "Unauthorized to view applications" });
    }

    res.status(200).json({ success: true, applications });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};