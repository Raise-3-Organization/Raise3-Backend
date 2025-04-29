const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth, requireRole } = require('../utils/authUtils');

// Get user profile
router.get('/profile', requireAuth, async (req, res) => {
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
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
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
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Register as a founder
router.post('/register-founder', requireAuth, async (req, res) => {
  try {
    const {
      name,
      email,
      projectType,
      blockchainPreference
    } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
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
    console.error('Error registering as founder:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Register as an investor
router.post('/register-investor', requireAuth, async (req, res) => {
  try {
    const {
      name,
      email,
      investorType
    } = req.body;
    
    if (!name || !email || !investorType) {
      return res.status(400).json({ error: 'Name, email, and investor type are required' });
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
    console.error('Error registering as investor:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Initiate KYC process
router.post('/initiate-kyc', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user has already initiated KYC
    if (user.kycStatus !== 'not_started') {
      return res.status(400).json({ 
        error: 'KYC process already initiated',
        status: user.kycStatus
      });
    }
    
    // Update KYC status to pending
    user.kycStatus = 'pending';
    await user.save();
    
    // In a real application, you would integrate with a KYC provider here
    // For now, we'll just return a success message
    
    return res.status(200).json({
      success: true,
      message: 'KYC process initiated',
      kycStatus: user.kycStatus
    });
  } catch (error) {
    console.error('Error initiating KYC:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin only: Update user KYC status
router.put('/kyc-status/:walletAddress', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid KYC status' });
    }
    
    const user = await User.findOne({ walletAddress });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
    console.error('Error updating KYC status:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;