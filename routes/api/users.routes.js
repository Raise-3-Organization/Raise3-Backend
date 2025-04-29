const express = require('express');
const router = express.Router();
const User = require('../../models/user.model');
const { authenticateToken, authorizeRoles } = require('../../middlewares/auth.middleware');
const { logger } = require('../../utils/logger.util');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    return res.status(200).json({
      walletAddress: user.walletAddress,
      name: user.name,
      email: user.email,
      userType: user.userType,
      projectType: user.projectType,
      blockchainPreference: user.blockchainPreference,
      investorType: user.investorType,
      kycStatus: user.kycStatus,
      profileCompleted: !!user.name
    });
  } catch (error) {
    logger.error('Error fetching profile:', error);
    return res.status(500).json({ 
      errors: [{ error: 'Server error' }]
    });
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               userType:
 *                 type: string
 *                 enum: [founder, investor]
 *               projectType:
 *                 type: string
 *                 enum: [Infrastructure, DeFi, GameFi, Web3 Utility]
 *               blockchainPreference:
 *                 type: string
 *               investorType:
 *                 type: string
 *                 enum: [Angel, DAO, VC, Accredited Retail]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      email,
      userType,
      projectType,
      blockchainPreference,
      investorType
    } = req.body;
    
    const user = req.user;
    
    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (userType && ['founder', 'investor'].includes(userType)) {
      user.userType = userType;
      
      // Add appropriate role
      if (!user.roles.includes(userType)) {
        user.roles.push(userType);
      }
    }
    
    // Founder specific fields
    if (projectType) user.projectType = projectType;
    if (blockchainPreference) user.blockchainPreference = blockchainPreference;
    
    // Investor specific fields
    if (investorType) user.investorType = investorType;
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        walletAddress: user.walletAddress,
        name: user.name,
        email: user.email,
        userType: user.userType,
        projectType: user.projectType,
        blockchainPreference: user.blockchainPreference,
        investorType: user.investorType,
        kycStatus: user.kycStatus,
        profileCompleted: !!user.name
      }
    });
  } catch (error) {
    logger.error('Error updating profile:', error);
    return res.status(500).json({ 
      errors: [{ error: 'Server error' }]
    });
  }
});

/**
 * @swagger
 * /api/users/register-founder:
 *   post:
 *     summary: Register as a founder
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               projectType:
 *                 type: string
 *                 enum: [Infrastructure, DeFi, GameFi, Web3 Utility]
 *               blockchainPreference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registered as founder successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/register-founder', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      email,
      projectType,
      blockchainPreference
    } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ 
        errors: [{ error: 'Name and email are required' }]
      });
    }
    
    const user = req.user;
    
    // Update user as founder
    user.name = name;
    user.email = email;
    user.userType = 'founder';
    user.projectType = projectType || null;
    user.blockchainPreference = blockchainPreference || null;
    
    // Add founder role
    if (!user.roles.includes('founder')) {
      user.roles.push('founder');
    }
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Registered as founder successfully',
      user: {
        walletAddress: user.walletAddress,
        name: user.name,
        email: user.email,
        userType: user.userType,
        projectType: user.projectType,
        blockchainPreference: user.blockchainPreference,
        kycStatus: user.kycStatus
      }
    });
  } catch (error) {
    logger.error('Error registering as founder:', error);
    return res.status(500).json({ 
      errors: [{ error: 'Server error' }]
    });
  }
});

/**
 * @swagger
 * /api/users/register-investor:
 *   post:
 *     summary: Register as an investor
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - investorType
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               investorType:
 *                 type: string
 *                 enum: [Angel, DAO, VC, Accredited Retail]
 *     responses:
 *       200:
 *         description: Registered as investor successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/register-investor', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      email,
      investorType
    } = req.body;
    
    if (!name || !email || !investorType) {
      return res.status(400).json({ 
        errors: [{ error: 'Name, email, and investor type are required' }]
      });
    }
    
    const user = req.user;
    
    // Update user as investor
    user.name = name;
    user.email = email;
    user.userType = 'investor';
    user.investorType = investorType;
    
    // Add investor role
    if (!user.roles.includes('investor')) {
      user.roles.push('investor');
    }
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Registered as investor successfully',
      user: {
        walletAddress: user.walletAddress,
        name: user.name,
        email: user.email,
        userType: user.userType,
        investorType: user.investorType,
        kycStatus: user.kycStatus
      }
    });
  } catch (error) {
    logger.error('Error registering as investor:', error);
    return res.status(500).json({ 
      errors: [{ error: 'Server error' }]
    });
  }
});

/**
 * @swagger
 * /api/users/initiate-kyc:
 *   post:
 *     summary: Initiate KYC process
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC process initiated
 *       400:
 *         description: KYC already initiated
 *       401:
 *         description: Unauthorized
 */
router.post('/initiate-kyc', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user has already initiated KYC
    if (user.kycStatus !== 'not_started') {
      return res.status(400).json({ 
        errors: [{ 
          error: 'KYC process already initiated',
          status: user.kycStatus
        }]
      });
    }
    
    // Update KYC status to pending
    user.kycStatus = 'pending';
    await user.save();
    
    // In a real application, you would integrate with a KYC provider here
    
    return res.status(200).json({
      success: true,
      message: 'KYC process initiated',
      kycStatus: user.kycStatus
    });
  } catch (error) {
    logger.error('Error initiating KYC:', error);
    return res.status(500).json({ 
      errors: [{ error: 'Server error' }]
    });
  }
});

/**
 * @swagger
 * /api/users/kyc-status/{walletAddress}:
 *   put:
 *     summary: Update user KYC status (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: KYC status updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.put('/kyc-status/:walletAddress', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        errors: [{ error: 'Invalid KYC status' }]
      });
    }
    
    const user = await User.findOne({ walletAddress });
    
    if (!user) {
      return res.status(404).json({ 
        errors: [{ error: 'User not found' }]
      });
    }
    
    user.kycStatus = status;
    
    if (status === 'approved') {
      user.kycCompletedAt = new Date();
    }
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: `KYC status updated to ${status}`,
      user: {
        walletAddress: user.walletAddress,
        kycStatus: user.kycStatus,
        kycCompletedAt: user.kycCompletedAt
      }
    });
  } catch (error) {
    logger.error('Error updating KYC status:', error);
    return res.status(500).json({ 
      errors: [{ error: 'Server error' }]
    });
  }
});

module.exports = router;