const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { logger } = require('../utils/logger.util');

/**
 * Middleware to authenticate JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        errors: [{ error: 'Authentication token is required' }]
      });
    }
    
    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET || 'raise3_secret_key', async (err, decoded) => {
      if (err) {
        return res.status(403).json({ 
          errors: [{ error: 'Invalid or expired token' }]
        });
      }
      
      // Find the user
      const user = await User.findOne({ walletAddress: decoded.walletAddress });
      
      if (!user) {
        return res.status(404).json({ 
          errors: [{ error: 'User not found' }]
        });
      }
      
      // Attach the user to the request
      req.user = user;
      next();
    });
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      errors: [{ error: 'Server error' }]
    });
  }
};

/**
 * Middleware to check if a user has a specific role
 * @param {string[]} roles - Array of allowed roles
 */
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        errors: [{ error: 'Authentication required' }]
      });
    }
    
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({ 
        errors: [{ error: 'Insufficient permissions' }]
      });
    }
    
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};