const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/User");
const Volunteer = require("../models/Volunteer");
// const Admin = require("../models/Admin");
dotenv.config();

exports.auth = async (req, res, next) => {
  try {
    
    const token =
     req.cookies?.token || 
      req.body?.token || 
      req.header("Authorization")?.replace("Bearer ", "") ||
      req.headers?.authorization?.replace("Bearer ", "") ||
      req.headers?.token;

    console.log("Extracted Token:", token);

    
    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded Token:", decoded);
      req.user = decoded;
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({ success: false, message: "Token is invalid" });
    }
    
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ success: false, message: "Something went wrong while validating the token" });
  }

};

exports.isHost = async (req, res, next) => {
  try{
    // console.log(1)
    const user = await User.findById(req.user.id);
    // console.log(2)
    if(!user){
      return res.status(401).json({ success: false, message: "User not found" });
    }
    // console.log(3)
    if(user.role !== 'host' && user.role !=='admin'){
      return res.status(403).json({ success: false, message: "User is not a host or admin" });
    }

    // console.log("User is a host or admin:", user);
    next();
  }
  catch(error){
    // console.error("Authentication error:", error);
    return res.status(500).json({ success: false, message: "User role can't be verified" });
  }
}

exports.isVolunteer=async(req,res,next)=>{
    try{
        const user = await User.findById(req.user.id);
        if(!user){
            return res.status(401).json({ success: false, message: "User not found" });
        }
        if(user.role !== "volunteer" && user.role!=="admin"){
            return res.status(403).json({ success: false, message: "User is not a volunteer or admin" });
        }
        next();
    }
    catch(error){
        return res.status(500).json({ success: false, message: "User role can't be verified" });
    }
}

exports.isAdmin=async(req,res,next)=>{
    try{
        const user = await User.findById(req.user.id);
        if(!user){
            return res.status(401).json({ success: false, message: "User not found" });
        }
        if(user.role !== "admin"){
            return res.status(403).json({ success: false, message: "User is not an admin" });
        }
        next();
    }
    catch(error){
        return res.status(500).json({ success: false, message: "User role can't be verified" });
    }
}

exports.isPaidMember=async(req,res,next)=>{
  try{
    const userId=req.user.id;
    const vol=await Volunteer.findById(userId);
    if(!vol){
      return res.status(404).json({ success: false, message: "Volunteer not found" });
    }
    if(!vol.isPaidMember){
      return res.status(403).json({ success: false, message: "Volunteer is not a paid member" });
    }
    if(vol.membershipExpiresAt && vol.membershipExpiresAt < new Date()){
      return res.status(403).json({ success: false, message: "Membership has expired" });
    }
    next();
  }
  catch(error){
    return res.status(500).json({ success: false, message: "Paid member can't be verified" });
  }
}