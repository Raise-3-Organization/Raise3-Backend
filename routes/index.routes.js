const express = require("express");
const authRoutes = require('./api/auth.routes');
const usersRoutes = require('./api/users.routes');
const campaignRoutes = require('./api/campaign.routes');
const fileRoutes = require('./api/file.routes');
const investmentRoutes = require('./api/investment.routes');
const dashboardRoutes = require('./api/dashboard.routes');
const contractRoutes = require('./api/contract.routes');

/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               error:
 *                 type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = function routes(app) {
    app.use(express.json());
    
    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/users', usersRoutes);
    app.use('/api/campaigns', campaignRoutes);
    app.use('/api/files', fileRoutes);
    app.use('/api/investments', investmentRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/contracts', contractRoutes);
}

