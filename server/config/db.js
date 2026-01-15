const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connection options optimized for free tier (MongoDB Atlas M0)
    // M0 has 500 connections limit, but we use conservative pooling
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,          // Max connections in pool (default: 100)
      minPoolSize: 2,           // Keep 2 connections ready
      serverSelectionTimeoutMS: 5000, // Fail fast if no server
      socketTimeoutMS: 45000,   // Close sockets after 45s inactivity
      maxIdleTimeMS: 30000,     // Close idle connections after 30s
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
