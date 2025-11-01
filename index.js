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

// Connect to Database
database.connect();

// ---------- MIDDLEWARES ----------
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// ✅ Define allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "https://www.ghumobee.com",
  "https://ghumo-bee-demo.vercel.app",
  "https://ghumo-k299uqs2w-ghumobees-projects.vercel.app",
];

// ✅ Apply robust CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Handle all preflight (OPTIONS) requests manually for Render
app.options("*", cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ File upload + static files
app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp/" }));
app.use(express.static(path.join(__dirname, "public")));

// ---------- ROUTES ----------
const userRoutes = require("./routes/User");
const opportunityRoutes = require("./routes/Opportunity");
const applicationRoutes = require("./routes/Application");
const couponRoutes = require("./routes/Coupon");
const paymentRoutes = require("./routes/Payment");

app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/opportunity", opportunityRoutes);
app.use("/api/v1/application", applicationRoutes);
app.use("/api/v1/coupon", couponRoutes);
app.use("/api/v1/payment", paymentRoutes);

// ✅ Optional route to test CORS from frontend
app.get("/test-cors", (req, res) => {
  res.json({ success: true, message: "CORS is working perfectly ✅" });
});

// ---------- CLOUDINARY CONFIG ----------
cloudinaryConnect();

// ---------- START SERVER ----------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
