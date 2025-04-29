const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/dashboard.controller');
const { isAuthenticated } = require('../../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard data endpoints
 */

/**
 * @swagger
 * /api/dashboard/founder:
 *   get:
 *     summary: Get founder dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Founder dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 campaigns:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       status:
 *                         type: string
 *                       goalAmount:
 *                         type: number
 *                       currentAmount:
 *                         type: number
 *                       percentageFunded:
 *                         type: number
 *                       investorCount:
 *                         type: integer
 *                       deadline:
 *                         type: string
 *                         format: date-time
 *                 totalCampaigns:
 *                   type: integer
 *                 activeCampaigns:
 *                   type: integer
 *                 totalFundsRaised:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a founder
 */
router.get('/founder', isAuthenticated, dashboardController.getFounderDashboard);

/**
 * @swagger
 * /api/dashboard/investor:
 *   get:
 *     summary: Get investor dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Investor dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 investments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       campaign:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           status:
 *                             type: string
 *                       amount:
 *                         type: number
 *                       status:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 *                 totalInvestments:
 *                   type: integer
 *                 totalAmountInvested:
 *                   type: number
 *                 activeInvestments:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an investor
 */
router.get('/investor', isAuthenticated, dashboardController.getInvestorDashboard);

/**
 * @swagger
 * /api/dashboard/campaign/{id}/analytics:
 *   get:
 *     summary: Get detailed analytics for a specific campaign
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 campaignId:
 *                   type: string
 *                 title:
 *                   type: string
 *                 status:
 *                   type: string
 *                 goalAmount:
 *                   type: number
 *                 currentAmount:
 *                   type: number
 *                 percentageFunded:
 *                   type: number
 *                 daysRemaining:
 *                   type: integer
 *                 totalInvestments:
 *                   type: integer
 *                 confirmedInvestments:
 *                   type: integer
 *                 uniqueInvestors:
 *                   type: integer
 *                 totalInvested:
 *                   type: number
 *                 fundingRate:
 *                   type: number
 *                 estimatedDaysToFullFunding:
 *                   type: integer
 *                   nullable: true
 *                 investmentTimeline:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       amount:
 *                         type: number
 *                 onChainData:
 *                   type: object
 *                   properties:
 *                     contractAddress:
 *                       type: string
 *                     campaignIndex:
 *                       type: integer
 *                     tokenAddress:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to view this campaign
 *       404:
 *         description: Campaign not found
 */
router.get('/campaign/:id/analytics', isAuthenticated, dashboardController.getCampaignAnalytics);

module.exports = router;