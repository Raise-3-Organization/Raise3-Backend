const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Investment:
 *       type: object
 *       required:
 *         - investor
 *         - campaign
 *         - amount
 *       properties:
 *         investor:
 *           type: string
 *           description: Wallet address of the investor
 *         campaign:
 *           type: string
 *           description: ID of the campaign being invested in
 *         amount:
 *           type: number
 *           description: Investment amount in ETH
 *         transactionHash:
 *           type: string
 *           description: Blockchain transaction hash
 *         status:
 *           type: string
 *           enum: [Pending, Confirmed, Refunded]
 *           description: Current status of the investment
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the investment was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the investment was last updated
 *       example:
 *         investor: "0x1234567890abcdef1234567890abcdef12345678"
 *         campaign: "60d21b4667d0d8992e610c85"
 *         amount: 2.5
 *         transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
 *         status: "Confirmed"
 */
const investmentSchema = new mongoose.Schema(
  {
    investor: {
      type: String,
      required: true,
      ref: 'User'
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Campaign'
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    tokenAddress: {
      type: String,
      trim: true
    },
    transactionHash: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Refunded'],
      default: 'Pending'
    },
    investorIndex: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Investment', investmentSchema);