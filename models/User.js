const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - walletAddress
 *         - role
 *       properties:
 *         walletAddress:
 *           type: string
 *           description: User's wallet address (primary identifier)
 *         role:
 *           type: string
 *           enum: [Founder, Investor]
 *           description: User's role in the platform
 *         name:
 *           type: string
 *           description: User's display name
 *         email:
 *           type: string
 *           description: User's email address
 *         profileImage:
 *           type: string
 *           description: URL to user's profile image
 *         bio:
 *           type: string
 *           description: User's biography or description
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last login
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the user was last updated
 *       example:
 *         walletAddress: "0x1234567890abcdef1234567890abcdef12345678"
 *         role: "Investor"
 *         name: "John Doe"
 *         email: "john@example.com"
 *         profileImage: "https://example.com/profile.jpg"
 *         bio: "Crypto enthusiast and early-stage investor"
 *         lastLogin: "2023-04-20T12:00:00Z"
 */
const userSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['Founder', 'Investor'],
      required: true
    },
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    profileImage: {
      type: String
    },
    bio: {
      type: String
    },
    lastLogin: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);