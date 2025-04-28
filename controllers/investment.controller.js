/**
 * Investment Controller
 * Handles investment management logic
 */
const Investment = require('../models/Investment');
const Campaign = require('../models/Campaign');
const { badRequest, notFound, forbidden, serverError } = require('../helpers/error');
const mongoose = require('mongoose');

/**
 * Record a new investment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const recordInvestment = async (req, res) => {
  try {
    // Get validated data from the validation middleware
    const { campaignId, amount, transactionHash, tokenAddress, investorIndex } = req.validatedBody;

    // Validate campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return notFound(res, 'Campaign not found');
    }

    // Validate campaign is active
    if (campaign.status !== 'Active') {
      return badRequest(res, `Cannot invest in a campaign with status: ${campaign.status}`);
    }

    // Get investor wallet address from authenticated user
    const investorWalletAddress = req.user._id;

    // Create new investment
    const investment = new Investment({
      investor: investorWalletAddress,
      campaign: campaignId,
      amount,
      tokenAddress: tokenAddress || campaign.tokenAddress, // Use campaign token if not specified
      transactionHash,
      investorIndex: investorIndex, // Store the investor index from the smart contract
      status: 'Pending'
    });

    // Save investment to database
    await investment.save();

    // Update campaign's current amount if transaction hash is provided
    if (transactionHash) {
      campaign.currentAmount += amount;
      
      // Check if campaign is now fully funded
      if (campaign.currentAmount >= campaign.goalAmount) {
        campaign.status = 'Funded';
      }
      
      await campaign.save();
    }

    // Note: At this point, the frontend should have already called the smart contract's
    // grantInvestorRole function with the investor's address, amount, and token address
    // and received the investor index from the blockchain

    res.status(201).json(investment);
  } catch (error) {
    console.error('Error recording investment:', error);
    return serverError(res, 'Failed to record investment');
  }
};

/**
 * Get all investments for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getInvestments = async (req, res) => {
  try {
    // Get validated query parameters from the validation middleware
    const { status, campaignId } = req.validatedQuery;
    
    // Get investor wallet address from authenticated user
    const investorWalletAddress = req.user._id;

    // Build query
    const query = { investor: investorWalletAddress };
    
    // Add filters if provided
    if (status) {
      query.status = status;
    }
    
    if (campaignId) {
      query.campaign = campaignId;
    }

    // Fetch investments from database
    const investments = await Investment.find(query)
      .populate('campaign', 'title goalAmount status')
      .sort({ createdAt: -1 });

    res.status(200).json(investments);
  } catch (error) {
    console.error('Error fetching investments:', error);
    return serverError(res, 'Failed to fetch investments');
  }
};

/**
 * Get investment by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getInvestmentById = async (req, res) => {
  try {
    // Get validated ID from the validation middleware
    const { id } = req.validatedParams;

    // Get investor wallet address from authenticated user
    const investorWalletAddress = req.user._id;

    // Fetch investment from database
    const investment = await Investment.findById(id)
      .populate('campaign', 'title description goalAmount deadline founder status');

    // Check if investment exists
    if (!investment) {
      return notFound(res, 'Investment not found');
    }

    // Check if user is the investor
    if (investment.investor !== investorWalletAddress) {
      return forbidden(res, 'You do not have permission to view this investment');
    }

    res.status(200).json(investment);
  } catch (error) {
    console.error('Error fetching investment:', error);
    return serverError(res, 'Failed to fetch investment details');
  }
};

/**
 * Update investment status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateInvestmentStatus = async (req, res) => {
  try {
    // Get validated ID from the validation middleware
    const { id } = req.validatedParams;
    
    // Get validated data from the validation middleware
    const { status, transactionHash, founderIndex } = req.validatedBody;

    // Get user wallet address from authenticated user
    const userWalletAddress = req.user._id;

    // Fetch investment from database
    const investment = await Investment.findById(id).populate('campaign');
    
    // Check if investment exists
    if (!investment) {
      return notFound(res, 'Investment not found');
    }

    // Check if user is authorized to update the status
    // Only the investor can update to Refunded, and only the campaign founder can update to Confirmed
    const campaign = investment.campaign;
    
    if (status === 'Confirmed' && campaign.founder !== userWalletAddress) {
      return forbidden(res, 'Only the campaign founder can confirm investments');
    }
    
    if (status === 'Refunded' && investment.investor !== userWalletAddress) {
      return forbidden(res, 'Only the investor can request a refund');
    }

    // Store the previous status for comparison
    const previousStatus = investment.status;

    // Update investment
    investment.status = status;
    
    if (transactionHash) {
      investment.transactionHash = transactionHash;
    }

    // If status is changing to Confirmed, update campaign's current amount
    if (status === 'Confirmed' && previousStatus !== 'Confirmed') {
      // For Confirmed status, we need to ensure the blockchain transaction has been processed
      // The frontend should have called the smart contract's founderCampaign function
      // with the campaign index, amount, and founder index
      
      campaign.currentAmount += investment.amount;
      
      // Check if campaign is now fully funded
      if (campaign.currentAmount >= campaign.goalAmount) {
        campaign.status = 'Funded';
      }
      
      await campaign.save();
    }
    
    // If status is changing from Confirmed to Refunded, reduce campaign's current amount
    if (status === 'Refunded' && previousStatus === 'Confirmed') {
      // For Refunded status, the frontend should handle the appropriate blockchain transaction
      // This might involve a separate contract function for refunds
      
      campaign.currentAmount -= investment.amount;
      
      // If campaign was funded but now isn't, change status back to Active
      if (campaign.status === 'Funded' && campaign.currentAmount < campaign.goalAmount) {
        campaign.status = 'Active';
      }
      
      await campaign.save();
    }

    // Save updated investment
    await investment.save();

    res.status(200).json(investment);
  } catch (error) {
    console.error('Error updating investment status:', error);
    return serverError(res, 'Failed to update investment status');
  }
};

module.exports = {
  recordInvestment,
  getInvestments,
  getInvestmentById,
  updateInvestmentStatus
};