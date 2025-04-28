const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Contract:
 *       type: object
 *       required:
 *         - campaign
 *         - address
 *         - type
 *       properties:
 *         campaign:
 *           type: string
 *           description: ID of the associated campaign
 *         address:
 *           type: string
 *           description: Blockchain address of the deployed contract
 *         type:
 *           type: string
 *           enum: [CampaignFunding, TokenSale]
 *           description: Type of smart contract
 *         metadata:
 *           type: object
 *           description: Additional contract-specific metadata
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the contract was deployed
 *       example:
 *         campaign: "60d21b4667d0d8992e610c85"
 *         address: "0xabcdef1234567890abcdef1234567890abcdef12"
 *         type: "CampaignFunding"
 *         metadata: {
 *           network: "ethereum",
 *           deployedBy: "0x1234567890abcdef1234567890abcdef12345678",
 *           deploymentTx: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
 *         }
 */
const contractSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Campaign'
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['CampaignFunding', 'TokenSale'],
      required: true
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Contract', contractSchema);