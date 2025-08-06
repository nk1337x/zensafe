const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/db.js");
const residentRoutes = require("./src/routes/residentRoutes");
const authorityRoutes = require("./src/routes/authorityRoutes");
const mailRoutes = require("./src/routes/mailRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const alertRoutes = require("./src/routes/alertRoutes.js");
const { checkAlerts } = require("./src/services/caseService.js");
const uploadToIPFSRoutes = require("./src/routes/uploadToIPFSRoutes");

const http = require("http");
const path = require("path");
dotenv.config();

// Initialize express app
const app = express();

// Database connection
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files
app.use("/data", express.static(path.join(__dirname, "data")));

// Routes
app.use("/api/alerts", alertRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/residents", residentRoutes);
app.use("/api/authorities", authorityRoutes);
app.use("/api/mail", mailRoutes);
app.use("/api/upload", uploadToIPFSRoutes);

// setInterval(checkAlerts, 5000);

const runCheckAlerts = async () => {
  try {
    await checkAlerts(); // Wait for checkAlerts to complete
  } catch (error) {
    console.error("Error in checkAlerts:", error);
  } finally {
    setTimeout(runCheckAlerts, 5000); // Schedule the next execution
  }
};

// Start the first execution
runCheckAlerts();

// Start server
const PORT = process.env.PORT || 5000;

// Allow the server to be accessible from the local network
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT} (Local)`);
});
