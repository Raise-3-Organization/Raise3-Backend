const express = require('express');
const router = express.Router();
const contractController = require('../../controllers/contract.controller');
const { isAuthenticated } = require('../../middlewares/auth');
const { validateBody, validateParams } = require('../../middlewares/validate');
const { 
  recordContractSchema, 
  contractTypeSchema, 
  campaignIdSchema 
} = require('../../validations/contract');

/**
 * @swagger
 * tags:
 *   name: Contracts
 *   description: Smart contract interface endpoints
 */

/**
 * @swagger
 * /api/contracts/abi/{type}:
 *   get:
 *     summary: Get contract ABI by type
 *     tags: [Contracts]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CampaignFunding, TokenSale]
 *         description: Contract type
 *     responses:
 *       200:
 *         description: Contract ABI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 abi:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Contract type not found
 */
router.get('/abi/:type', 
  validateParams(contractTypeSchema), 
  contractController.getContractAbi
);

/**
 * @swagger
 * /api/contracts/record:
 *   post:
 *     summary: Record a deployed contract
 *     tags: [Contracts]
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
 *               - address
 *               - type
 *             properties:
 *               campaignId:
 *                 type: string
 *                 description: ID of the associated campaign
 *               address:
 *                 type: string
 *                 description: Contract address
 *               type:
 *                 type: string
 *                 enum: [CampaignFunding, TokenSale]
 *                 description: Contract type
 *               metadata:
 *                 type: object
 *                 description: Additional contract metadata
 *     responses:
 *       201:
 *         description: Contract recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contract'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/record', 
  isAuthenticated, 
  validateBody(recordContractSchema), 
  contractController.recordContract
);

/**
 * @swagger
 * /api/contracts/{campaignId}:
 *   get:
 *     summary: Get contract details for a campaign
 *     tags: [Contracts]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Contract details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contract'
 *       404:
 *         description: Contract not found
 */
router.get('/:campaignId', 
  validateParams(campaignIdSchema), 
  contractController.getContractByCampaignId
);

module.exports = router;