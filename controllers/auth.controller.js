/**
 * Authentication Controller
 * Handles wallet-based authentication logic
 */
const ethers = require('ethers');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');
const { logger } = require('../utils/logger.util');

/**
 * Generate a random nonce for wallet authentication
 * @returns {string} A random nonce
 */
const generateNonce = () => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Verify an Ethereum signature
 * @param {string} message - The original message that was signed
 * @param {string} signature - The signature to verify
 * @param {string} walletAddress - The wallet address that supposedly signed the message
 * @returns {boolean} Whether the signature is valid
 */
const verifyEthSignature = (message, signature, walletAddress) => {
  try {
    // Recover the address from the signature
    const messageHash = ethers.utils.hashMessage(message);
    const recoveredAddress = ethers.utils.recoverAddress(messageHash, signature);
    
    // Compare the recovered address with the provided wallet address
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    logger.error('Error verifying signature:', error);
    return false;
  }
};

/**
 * Initiate wallet connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const connectWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
      return res.status(400).json({ 
        errors: [{ error: 'Invalid wallet address' }]
      });
    }
    
    // Check if user exists, if not create a new one
    let user = await User.findOne({ walletAddress });
    
    if (!user) {
      // Create new user with just the wallet address
      user = new User({
        walletAddress,
        nonce: generateNonce(),
        lastNonceGeneratedAt: new Date()
      });
    } else {
      // Update nonce for existing user
      user.nonce = generateNonce();
      user.lastNonceGeneratedAt = new Date();
    }
    
    await user.save();
    
    return res.status(200).json({ 
      message: `Please sign this message to verify your wallet ownership: ${user.nonce}`,
      nonce: user.nonce
    });
  } catch (error) {
    logger.error('Error generating nonce:', error);
    return res.status(500).json({ 
      errors: [{ error: 'Server error' }]
    });
  }
};

/**
 * Verify wallet signature and issue JWT
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifySignature = async (req, res) => {
  try {
    const { walletAddress, signature, nonce } = req.body;
    
    if (!walletAddress || !signature) {
      return res.status(400).json({ 
        errors: [{ error: 'Wallet address and signature are required' }]
      });
    }
    
    // Find user by wallet address
    const user = await User.findOne({ walletAddress });
    
    if (!user) {
      return res.status(404).json({ 
        errors: [{ error: 'User not found' }]
      });
    }
    
    // Verify the signature
    const message = `Please sign this message to verify your wallet ownership: ${user.nonce}`;
    const isValid = verifyEthSignature(message, signature, walletAddress);
    
    if (!isValid) {
      return res.status(401).json({ 
        errors: [{ error: 'Invalid signature' }]
      });
    }
    
    // Generate a new nonce for next login
    user.nonce = generateNonce();
    user.lastLoginAt = new Date();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        walletAddress: user.walletAddress,
        roles: user.roles || []
      },
      process.env.JWT_SECRET || 'raise3_secret_key',
      { expiresIn: '24h' }
    );
    
    await user.save();
    
    return res.status(200).json({
      token,
      user: {
        walletAddress: user.walletAddress,
        userType: user.userType || null,
        roles: user.roles || [],
        profileCompleted: !!user.name
      }
    });
  } catch (error) {
    logger.error('Error verifying signature:', error);
    return res.status(500).json({ 
      errors: [{ error: 'Server error' }]
    });
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCurrentUser = async (req, res) => {
  try {
    // The user should be attached to the request by the auth middleware
    if (!req.user) {
      return res.status(401).json({ 
        errors: [{ error: 'Not authenticated' }]
      });
    }
    
    const user = await User.findOne({ walletAddress: req.user.walletAddress });
    
    if (!user) {
      return res.status(404).json({ 
        errors: [{ error: 'User not found' }]
      });
    }
    
    return res.status(200).json({
      walletAddress: user.walletAddress,
      name: user.name,
      email: user.email,
      userType: user.userType,
      roles: user.roles,
      projectType: user.projectType,
      blockchainPreference: user.blockchainPreference,
      investorType: user.investorType,
      kycStatus: user.kycStatus,
      profileCompleted: !!user.name
    });
  } catch (error) {
    logger.error('Error getting current user:', error);
    return res.status(500).json({ 
      errors: [{ error: 'Server error' }]
    });
  }
};

/**
 * End user session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = (req, res) => {
  // JWT tokens are stateless, so we don't need to do anything server-side
  // The client should remove the token from storage
  
  return res.status(200).json({
    message: 'Logged out successfully'
  });
};

module.exports = {
  connectWallet,
  verifySignature,
  getCurrentUser,
  logout
};