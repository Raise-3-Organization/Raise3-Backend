const express = require('express');
const router = express.Router();
const campaignController = require('../../controllers/campaign.controller');
const { isAuthenticated } = require('../../middlewares/auth');
const { validateBody, validateParams, validateQuery } = require('../../middlewares/validate');
const { 
  createCampaignSchema, 
  updateCampaignSchema, 
  campaignIdSchema, 
  updateCampaignStatusSchema,
  campaignQuerySchema
} = require('../../validations/campaign');

/**
 * @swagger
 * tags:
 *   name: Campaigns
 *   description: Campaign management endpoints
 */

/**
 * @swagger
 * /api/campaigns:
 *   post:
 *     summary: Create a new campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - goalAmount
 *               - deadline
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               goalAmount:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of file IDs
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', isAuthenticated, validateBody(createCampaignSchema), campaignController.createCampaign);

/**
 * @swagger
 * /api/campaigns:
 *   get:
 *     summary: Get all campaigns with optional filters
 *     tags: [Campaigns]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Active, Funded, Expired]
 *         description: Filter by campaign status
 *       - in: query
 *         name: founder
 *         schema:
 *           type: string
 *         description: Filter by founder wallet address
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of campaigns to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: List of campaigns
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 campaigns:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Campaign'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 pages:
 *                   type: integer
 */
router.get('/', validateQuery(campaignQuerySchema), campaignController.getCampaigns);

/**
 * @swagger
 * /api/campaigns/{id}:
 *   get:
 *     summary: Get campaign by ID
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 *       404:
 *         description: Campaign not found
 */
router.get('/:id', validateParams(campaignIdSchema), campaignController.getCampaignById);

/**
 * @swagger
 * /api/campaigns/{id}:
 *   put:
 *     summary: Update campaign details
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               goalAmount:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of file IDs
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the campaign owner
 *       404:
 *         description: Campaign not found
 */
router.put('/:id', 
  isAuthenticated, 
  validateParams(campaignIdSchema),
  validateBody(updateCampaignSchema), 
  campaignController.updateCampaign
);

/**
 * @swagger
 * /api/campaigns/{id}/status:
 *   get:
 *     summary: Get campaign funding status
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign status details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [Draft, Active, Funded, Expired]
 *                 goalAmount:
 *                   type: number
 *                 currentAmount:
 *                   type: number
 *                 percentageFunded:
 *                   type: number
 *                 investorCount:
 *                   type: integer
 *                 timeRemaining:
 *                   type: object
 *                   properties:
 *                     days:
 *                       type: integer
 *                     hours:
 *                       type: integer
 *                     minutes:
 *                       type: integer
 *       404:
 *         description: Campaign not found
 */
router.get('/:id/status', validateParams(campaignIdSchema), campaignController.getCampaignStatus);

/**
 * @swagger
 * /api/campaigns/{id}/status:
 *   put:
 *     summary: Update campaign status
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
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
 *                 enum: [Draft, Active, Funded, Expired]
 *               contractAddress:
 *                 type: string
 *                 description: Required when activating a campaign
 *     responses:
 *       200:
 *         description: Campaign status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the campaign owner
 *       404:
 *         description: Campaign not found
 */
router.put('/:id/status', 
  isAuthenticated, 
  validateParams(campaignIdSchema),
  validateBody(updateCampaignStatusSchema), 
  campaignController.updateCampaignStatus
);

module.exports = router;