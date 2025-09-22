const express = require("express");
const router = express.Router();

const {
    createOpportunity,
    editOpportunity,
    // removeOpportunity,
    getOpportunityById,
    getOpportunities,
    getHostOpportunity,
    getAllOpportunities
} = require("../controllers/Opportunity");

const{auth,isHost,isVolunteer,isAdmin}=require("../middlewares/auth");

// Create a new opportunity
router.post("/create", auth, isHost, createOpportunity);

// Get all opportunities for a specific host
router.get("/get-host-opportunities", auth, isHost, getHostOpportunity);

// Get all opportunities - MOVED BEFORE /:id
router.get('/getAllOpportunities', getAllOpportunities);

// Edit an opportunity
router.put("/edit/:id", auth, isHost, editOpportunity);


// Remove (soft delete) an opportunity
// router.post("/remove/:id", auth, isHost, removeOpportunity);

// Get all opportunities (with query params) - MOVED BEFORE /:id
router.get("/", getOpportunities);

// Get opportunity by ID - MOVED TO END
router.get("/:id", getOpportunityById);

module.exports = router;
