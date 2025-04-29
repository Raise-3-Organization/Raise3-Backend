const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Campaign:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - goalAmount
 *         - deadline
 *         - founder
 *       properties:
 *         title:
 *           type: string
 *           description: Campaign title
 *         description:
 *           type: string
 *           description: Detailed description of the campaign
 *         goalAmount:
 *           type: number
 *           description: Funding goal amount in ETH
 *         deadline:
 *           type: string
 *           format: date-time
 *           description: Campaign deadline
 *         founder:
 *           type: string
 *           description: Wallet address of the campaign founder
 *         contractAddress:
 *           type: string
 *           description: Address of the deployed smart contract
 *         status:
 *           type: string
 *           enum: [Draft, Active, Funded, Expired]
 *           description: Current status of the campaign
 *         currentAmount:
 *           type: number
 *           description: Current amount raised in ETH
 *         files:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of file IDs associated with the campaign
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the campaign was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the campaign was last updated
 *       example:
 *         title: "Decentralized Identity Solution"
 *         description: "Building a self-sovereign identity solution on Ethereum"
 *         goalAmount: 20
 *         deadline: "2023-06-30T23:59:59Z"
 *         founder: "0x1234567890abcdef1234567890abcdef12345678"
 *         contractAddress: "0xabcdef1234567890abcdef1234567890abcdef12"
 *         status: "Active"
 *         currentAmount: 5.5
 *         files: ["file1Id", "file2Id"]
 */
const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    goalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    deadline: {
      type: Date,
      required: true
    },
    founder: {
      type: String,
      required: true,
      ref: 'User'
    },
    contractAddress: {
      type: String,
      trim: true
    },
    tokenAddress: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Funded', 'Expired'],
      default: 'Draft'
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    campaignIndex: {
      type: Number,
      default: null
    },
    files: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File'
    }]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Campaign', campaignSchema);