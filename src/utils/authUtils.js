const crypto = require('crypto');
const ethers = require('ethers');

/**
 * Generate a random nonce for wallet authentication
 * @returns {string} A random nonce
 */
const generateNonce = () => {
  // Generate a random string of 32 characters
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Verify an Ethereum signature
 * @param {string} message - The original message that was signed
 * @param {string} signature - The signature to verify
 * @param {string} walletAddress - The wallet address that supposedly signed the message
 * @returns {boolean} Whether the signature is valid
 */
const verifySignature = (message, signature, walletAddress) => {
  try {
    // Recover the address from the signature
    const messageHash = ethers.utils.hashMessage(message);
    const recoveredAddress = ethers.utils.recoverAddress(messageHash, signature);
    
    // Compare the recovered address with the provided wallet address
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

/**
 * Middleware to check if a user is authenticated
 */
const requireAuth = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const user = await User.findOne({ 
      sessionToken: token,
      sessionExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Middleware to check if a user has a specific role
 * @param {string[]} roles - Array of allowed roles
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = {
  generateNonce,
  verifySignature,
  requireAuth,
  requireRole
};