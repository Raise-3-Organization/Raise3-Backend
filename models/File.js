const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     File:
 *       type: object
 *       required:
 *         - originalName
 *         - storageUrl
 *         - fileType
 *       properties:
 *         originalName:
 *           type: string
 *           description: Original filename
 *         storageUrl:
 *           type: string
 *           description: URL where the file is stored (Cloudinary)
 *         fileType:
 *           type: string
 *           enum: [pitch_deck, whitepaper, other]
 *           description: Type of document
 *         campaign:
 *           type: string
 *           description: ID of the associated campaign
 *         uploadedBy:
 *           type: string
 *           description: Wallet address of the user who uploaded the file
 *         publicId:
 *           type: string
 *           description: Cloudinary public ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the file was uploaded
 *       example:
 *         originalName: "pitch_deck.pdf"
 *         storageUrl: "https://res.cloudinary.com/demo/image/upload/v1234567890/pitch_deck.pdf"
 *         fileType: "pitch_deck"
 *         campaign: "60d21b4667d0d8992e610c85"
 *         uploadedBy: "0x1234567890abcdef1234567890abcdef12345678"
 *         publicId: "raise3/files/pitch_deck_12345"
 */
const fileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true
    },
    storageUrl: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      enum: ['pitch_deck', 'whitepaper', 'other'],
      required: true
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign'
    },
    uploadedBy: {
      type: String,
      required: true,
      ref: 'User'
    },
    publicId: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('File', fileSchema);