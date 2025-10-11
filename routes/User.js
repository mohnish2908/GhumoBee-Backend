const express = require("express")
const router = express.Router()


const {
	login,
	// sendOTP,
	createUser,
	editUser,
	changePassword,
	forgotPassword,
	verifyUser,
	getUser,
	getAllUsers,
	getUserById,
	adminVerifyUser,
	searchUserByEmail,
	contactUs
} = require("../controllers/Auth");

const { 
	updateHostProfile 
} = require("../controllers/Host");

const { 
	editVolunteer,
	getSubscriptionStatus 
} = require("../controllers/Volunteer");



const{auth,isHost,isVolunteer,isAdmin}=require("../middlewares/auth");

router.post("/login", login);

// Host and Volunteer controllers


// Create user (register)
router.post("/createUser", createUser);

// Volunteer login
router.post("/login", login);

// Send OTP
// router.post("/send-otp", sendOTP);




// Edit user profile
router.put("/edit-user",auth, editUser);

// Edit host profile
router.post("/edit-host", auth, isHost, updateHostProfile);

// Edit volunteer profile
router.post("/edit-volunteer", auth, isVolunteer, editVolunteer);

// Get volunteer subscription status
router.get("/subscription-status", auth, isVolunteer, getSubscriptionStatus);

// Change password
router.post("/change-password", changePassword);

// Forgot password (send OTP)
router.post("/forgot-password", forgotPassword);

// Verify user (route placeholder, implement logic in controller)
router.post("/verify", verifyUser);

router.post("/get-user", getUser);

// Admin Routes - Protected with admin middleware
router.get("/admin/users", auth, isAdmin, getAllUsers);
router.get("/admin/user/:userId", auth, isAdmin, getUserById);
router.get("/admin/search-user", auth, isAdmin, searchUserByEmail);
router.put("/admin/verify-user/:userId", auth, isAdmin, adminVerifyUser);

router.post("/contactus",contactUs)

module.exports = router
