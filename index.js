const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const fileUpload = require("express-fileupload");
const { cloudinaryConnect } = require("./config/cloudinary");
const database = require("./config/database");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

database.connect();

// Middleware
app.use(express.json());
app.use(cookieParser());

app.use(cors({
   origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176",
    "https://www.ghumobee.com",
    "https://ghumo-bee-demo.vercel.app",
    "https://ghumo-k299uqs2w-ghumobees-projects.vercel.app"],
   credentials: true,
 }));
 
app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp/" }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Routes
const userRoutes = require("./routes/User");
const opportunityRoutes = require("./routes/Opportunity");
const applicationRoutes = require("./routes/Application");
const couponRoutes = require("./routes/Coupon");
const paymentRoutes = require("./routes/Payment");

app.use('/api/v1/auth', userRoutes);
app.use('/api/v1/opportunity', opportunityRoutes);
app.use('/api/v1/application', applicationRoutes);
app.use('/api/v1/coupon', couponRoutes);
app.use('/api/v1/payment', paymentRoutes);

// Cloudinary Configuration
cloudinaryConnect();

// Start the Server
app.listen(PORT,'0.0.0.0', () => {
   console.log(`Server is running on port ${PORT}`);
});