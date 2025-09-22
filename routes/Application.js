const express = require("express");
const router = express.Router();

const {
	createApplication,
	editApplication,
	getApplications
} = require("../controllers/Application");

// Create a new application
router.post("/create", createApplication);

// Edit an application
router.put("/edit/:applicationId", editApplication);

// Get applications (volunteer, host, admin)
router.get("/", getApplications);

module.exports = router;
