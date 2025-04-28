const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  nonce: {
    type: String,
    required: true
  },
  lastNonceGeneratedAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  userType: {
    type: String,
    enum: ['founder', 'investor', 'admin', null],
    default: null
  },
  roles: {
    type: [String],
    default: []
  },
  // Profile information
  name: {
    type: String,
    default: null
  },
  email: {
    type: String,
    default: null,
    sparse: true,
    trim: true,
    lowercase: true
  },
  projectType: {
    type: String,
    enum: ['Infrastructure', 'DeFi', 'GameFi', 'Web3 Utility', null],
    default: null
  },
  blockchainPreference: {
    type: String,
    default: null
  },
  // Investor specific fields
  investorType: {
    type: String,
    enum: ['Angel', 'DAO', 'VC', 'Accredited Retail', null],
    default: null
  },
  // KYC information
  kycStatus: {
    type: String,
    enum: ['not_started', 'pending', 'approved', 'rejected'],
    default: 'not_started'
  },
  kycCompletedAt: {
    type: Date,
    default: null
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', UserSchema);