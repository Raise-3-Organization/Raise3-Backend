const express = require('express');
const router = express.Router();
const investmentController = require('../../controllers/investment.controller');
const { isAuthenticated } = require('../../middlewares/auth');
const { validateBody, validateParams, validateQuery } = require('../../middlewares/validate');
const { 
  recordInvestmentSchema, 
  investmentIdSchema, 
  updateInvestmentStatusSchema,
  investmentQuerySchema
} = require('../../validations/investment');

/**
 * @swagger
 * tags:
 *   name: Investments
 *   description: Investment management endpoints
 */

/**
 * @swagger
 * /api/investments/record:
 *   post:
 *     summary: Record a new investment
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaignId
 *               - amount
 *             properties:
 *               campaignId:
 *                 type: string
 *                 description: ID of the campaign being invested in
 *               amount:
 *                 type: number
 *                 description: Investment amount in ETH
 *               transactionHash:
 *                 type: string
 *                 description: Blockchain transaction hash
 *     responses:
 *       201:
 *         description: Investment recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Investment'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/record', 
  isAuthenticated, 
  validateBody(recordInvestmentSchema), 
  investmentController.recordInvestment
);

/**
 * @swagger
 * /api/investments:
 *   get:
 *     summary: Get all investments for the current user
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Confirmed, Refunded]
 *         description: Filter by investment status
 *       - in: query
 *         name: campaignId
 *         schema:
 *           type: string
 *         description: Filter by campaign ID
 *     responses:
 *       200:
 *         description: List of investments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Investment'
 *       401:
 *         description: Unauthorized
 */
router.get('/', 
  isAuthenticated, 
  validateQuery(investmentQuerySchema), 
  investmentController.getInvestments
);

/**
 * @swagger
 * /api/investments/{id}:
 *   get:
 *     summary: Get investment by ID
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Investment ID
 *     responses:
 *       200:
 *         description: Investment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Investment'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the investor
 *       404:
 *         description: Investment not found
 */
router.get('/:id', 
  isAuthenticated, 
  validateParams(investmentIdSchema), 
  investmentController.getInvestmentById
);

/**
 * @swagger
 * /api/investments/{id}/status:
 *   put:
 *     summary: Update investment status
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Investment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, Confirmed, Refunded]
 *               transactionHash:
 *                 type: string
 *     responses:
 *       200:
 *         description: Investment status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Investment'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to update
 *       404:
 *         description: Investment not found
 */
router.put('/:id/status', 
  isAuthenticated, 
  validateParams(investmentIdSchema),
  validateBody(updateInvestmentStatusSchema), 
  investmentController.updateInvestmentStatus
);

module.exports = router;