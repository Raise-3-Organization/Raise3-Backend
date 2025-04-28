const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv").config();
const cors = require("cors");
const db = require("../configs/dbConfig");
const {AppError} = require("../helpers/error");
const { logger, expressPinoLogger } = require("../utils/logger.util");
const { swaggerDocs } = require("../configs/swagger");

// Create Express app
const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressPinoLogger({ logger }));

// Create HTTP server
const http = require('http').createServer(app);

//App Home Route
app.get("/", (req, res) => {
  res.send("Welcome to Raise3 Backend - Web3 Fundraising Platform");
});

//Register Routes
require("../routes/index.routes")(app);

//Initialize Swagger documentation
swaggerDocs(app);

//calling the db connection
db();

// Initialize blockchain event listeners
try {
  const blockchainService = require('../services/blockchain.service');
  blockchainService.initializeEventListeners();
  
  // Set up periodic sync (every 15 minutes)
  setInterval(() => {
    blockchainService.syncCampaignData();
  }, 15 * 60 * 1000);
  
  logger.info('Blockchain services initialized');
} catch (error) {
  logger.error('Failed to initialize blockchain services:', error);
}

app.use((error, req, res, next) => {
    error.status = error.status || "error";
    error.statusCode = error.statusCode || 500;
  
    res.status(error.statusCode).json({
      errors: [
        {
          error: error.message,
        },
      ],
    });
});

// Export both app and http server
module.exports = { app, http };