const express = require('express');
const router = express.Router();
const ethers = require('ethers');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { generateNonce, verifySignature } = require('../utils/authUtils');

// Generate a nonce for wallet connection
router.post('/nonce', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
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
      nonce: user.nonce,
      message: `Please sign this message to verify your wallet ownership: ${user.nonce}`
    });
  } catch (error) {
    console.error('Error generating nonce:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Verify signature and authenticate user
router.post('/verify', async (req, res) => {
  try {
    const { walletAddress, signature } = req.body;
    
    if (!walletAddress || !signature) {
      return res.status(400).json({ error: 'Wallet address and signature are required' });
    }
    
    // Find user by wallet address
    const user = await User.findOne({ walletAddress });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify the signature
    const message = `Please sign this message to verify your wallet ownership: ${user.nonce}`;
    const isValid = verifySignature(message, signature, walletAddress);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Generate a new nonce for next login
    user.nonce = generateNonce();
    user.lastLoginAt = new Date();
    
    // Generate session token
    const sessionToken = uuidv4();
    user.sessionToken = sessionToken;
    user.sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      token: sessionToken,
      user: {
        walletAddress: user.walletAddress,
        profileCompleted: !!user.name, // Check if profile is completed
        userType: user.userType || null,
        roles: user.roles || []
      }
    });
  } catch (error) {
    console.error('Error verifying signature:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Check authentication status
router.get('/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ authenticated: false });
    }
    
    const user = await User.findOne({ 
      sessionToken: token,
      sessionExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(401).json({ authenticated: false });
    }
    
    return res.status(200).json({
      authenticated: true,
      user: {
        walletAddress: user.walletAddress,
        profileCompleted: !!user.name,
        userType: user.userType || null,
        roles: user.roles || []
      }
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }
    
    const user = await User.findOne({ sessionToken: token });
    
    if (user) {
      user.sessionToken = null;
      user.sessionExpiry = null;
      await user.save();
    }
    
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;