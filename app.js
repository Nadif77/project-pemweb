const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./config/database"); // Import the database connection
const authRoutes = require("./routes/authRoutes");
const materialRoutes = require("./routes/materialRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const userRoutes = require("./routes/userRoutes");
const { JWT_SECRET } = require("./config/config"); // Import JWT_SECRET from config

const app = express();

// Middleware
app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // Parse JSON request bodies
app.use(express.static(path.join(__dirname, "."))); // Serve static files from the root of the project
app.use("/uploads", express.static(path.join(__dirname, ".", "uploads"))); // Serve uploaded files

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, ".", "uploads");
if (!require("fs").existsSync(uploadsDir)) {
  // Check if 'uploads' directory exists
  require("fs").mkdirSync(uploadsDir); // Create 'uploads' directory if it does not exist
}

// Routes
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "..", "index.html")); // Serve the main HTML file
// });
app.use("/api", authRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/students", userRoutes); // Re-using userRoutes for student data

// Error handling middleware (will be defined later)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.statusCode || 500)
    .json({ error: err.message || "Something broke!" });
});

module.exports = app;
