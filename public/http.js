
require("module-alias/register");
require("reflect-metadata");
const { createServer } = require("http");
const { app, http } = require("./app");  // Destructure both app and http


require("dotenv").config();

const PORT = process.env.PORT || 7001;
const server = http;  // Use the http server from app.js

// Start the HTTP server
server.listen(PORT, '0.0.0.0', () => {  // Explicitly bind to 0.0.0.0
  console.log(`Server is running on port ${PORT}`);
});

// Handle server errors
server.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
  }
  process.exit(1);  // Exit process on error
});
