const mongoose = require("mongoose");
require('dotenv').config();

exports.connect = () => {
    const mongoURL = process.env.MONGODB_URL;
    console.log("Attempting to connect to MongoDB...");
    
    if (!mongoURL) {
        console.error("MongoDB URL not found in environment variables");
        return;
    }
    
    mongoose.connect(mongoURL)
    .then(() => {
        console.log("DB connected successfully");
    })
    .catch((error) => {
        console.log("DB connection failed");
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    });

    // Handle connection events
    mongoose.connection.on('connected', () => {
        console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
        console.error('Mongoose connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('Mongoose disconnected');
    });

    // Handle app termination
    process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('Mongoose connection closed through app termination');
        process.exit(0);
    });
}