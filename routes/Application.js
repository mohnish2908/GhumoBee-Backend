const express = require("express");
const router = express.Router();

const {
	createApplication,
	editApplication,
	getApplications,
	getVolunteerSideApplications
} = require("../controllers/Application");

const{auth,isHost,isVolunteer,isAdmin,isPaidMember,isProfileComplete}=require("../middlewares/auth");

// Create a new application
router.post("/create", auth, isVolunteer, isProfileComplete, isPaidMember,createApplication);

// Edit an application
router.put("/edit/:applicationId", auth, isVolunteer, editApplication);

// Get applications (volunteer, host, admin)
router.get("/", auth, getApplications);

//get applications for volunteer only
router.get("/volunteer", auth, isVolunteer, getVolunteerSideApplications);


module.exports = router;
