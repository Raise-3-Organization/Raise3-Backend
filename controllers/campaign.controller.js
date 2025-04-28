/**
 * Campaign Controller
 * Handles campaign management logic
 */
const Campaign = require('../models/Campaign');
const Investment = require('../models/Investment');
const { badRequest, notFound, forbidden, serverError } = require('../helpers/error');
const mongoose = require('mongoose');

/**
 * Create a new campaign
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createCampaign = async (req, res) => {
  try {
    // Get validated data from the validation middleware
    const { title, description, goalAmount, deadline, files, tokenAddress } = req.validatedBody;

    // Get founder wallet address from authenticated user
    const founderWalletAddress = req.user._id;

    // Create new campaign
    const campaign = new Campaign({
      title,
      description,
      goalAmount,
      deadline: new Date(deadline),
      founder: founderWalletAddress,
      status: 'Draft',
      currentAmount: 0,
      tokenAddress: tokenAddress || null,
      files: files || []
    });

    // Save campaign to database
    await campaign.save();

    // Generate metaUrl for the smart contract
    // This URL will point to the campaign details in our backend
    const baseUrl = process.env.BASE_URL || 'https://api.raise3.io';
    const metaUrl = `${baseUrl}/api/campaigns/${campaign._id}`;

    // Return the campaign with the metaUrl that will be used when activating on-chain
    res.status(201).json({
      ...campaign.toJSON(),
      metaUrl
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return serverError(res, 'Failed to create campaign');
  }
};

/**
 * Get all campaigns with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCampaigns = async (req, res) => {
  try {
    // Get validated query parameters from the validation middleware
    const { status, founder, limit, page } = req.validatedQuery;
    
    // Build query
    const query = {};
    
    // Add filters if provided
    if (status) {
      query.status = status;
    }
    
    if (founder) {
      query.founder = founder;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Fetch campaigns from database with pagination
    const campaigns = await Campaign.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('files', 'filename url');

    // Get total count for pagination
    const total = await Campaign.countDocuments(query);
    
    // Calculate total pages
    const pages = Math.ceil(total / limit);

    res.status(200).json({
      campaigns,
      total,
      page,
      limit,
      pages
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return serverError(res, 'Failed to fetch campaigns');
  }
};

/**
 * Get campaign by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCampaignById = async (req, res) => {
  try {
    // Get validated ID from the validation middleware
    const { id } = req.validatedParams;

    // Fetch campaign from database
    const campaign = await Campaign.findById(id).populate('files', 'filename url');
    
    // Check if campaign exists
    if (!campaign) {
      return notFound(res, 'Campaign not found');
    }

    res.status(200).json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return serverError(res, 'Failed to fetch campaign details');
  }
};

/**
 * Update campaign details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateCampaign = async (req, res) => {
  try {
    // Get validated ID from the validation middleware
    const { id } = req.validatedParams;
    
    // Get validated data from the validation middleware
    const { title, description, goalAmount, deadline, files } = req.validatedBody;

    // Get user wallet address from authenticated user
    const userWalletAddress = req.user._id;

    // Fetch campaign from database
    const campaign = await Campaign.findById(id);
    
    // Check if campaign exists
    if (!campaign) {
      return notFound(res, 'Campaign not found');
    }

    // Check if user is the campaign founder
    if (campaign.founder !== userWalletAddress) {
      return forbidden(res, 'You do not have permission to update this campaign');
    }

    // Check if campaign is in Draft status
    if (campaign.status !== 'Draft') {
      return badRequest(res, 'Only campaigns in Draft status can be updated');
    }

    // Update campaign fields if provided
    if (title) campaign.title = title;
    if (description) campaign.description = description;
    if (goalAmount) campaign.goalAmount = goalAmount;
    if (deadline) campaign.deadline = new Date(deadline);
    if (files) campaign.files = files;

    // Save updated campaign
    await campaign.save();

    res.status(200).json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return serverError(res, 'Failed to update campaign');
  }
};

/**
 * Get campaign funding status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCampaignStatus = async (req, res) => {
  try {
    // Get validated ID from the validation middleware
    const { id } = req.validatedParams;

    // Fetch campaign from database
    const campaign = await Campaign.findById(id);
    
    // Check if campaign exists
    if (!campaign) {
      return notFound(res, 'Campaign not found');
    }

    // Get investor count
    const investorCount = await Investment.countDocuments({
      campaign: id,
      status: 'Confirmed'
    });

    // Calculate percentage funded
    const percentageFunded = (campaign.currentAmount / campaign.goalAmount) * 100;

    // Calculate time remaining
    const now = new Date();
    const deadline = new Date(campaign.deadline);
    let timeRemaining = { days: 0, hours: 0, minutes: 0 };
    
    if (deadline > now) {
      const diffMs = deadline - now;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      timeRemaining = {
        days: diffDays,
        hours: diffHours,
        minutes: diffMinutes
      };
    } else if (campaign.status === 'Active') {
      // If deadline has passed but status is still Active, update to Expired
      campaign.status = 'Expired';
      await campaign.save();
    }

    res.status(200).json({
      status: campaign.status,
      goalAmount: campaign.goalAmount,
      currentAmount: campaign.currentAmount,
      percentageFunded: parseFloat(percentageFunded.toFixed(2)),
      investorCount,
      timeRemaining
    });
  } catch (error) {
    console.error('Error fetching campaign status:', error);
    return serverError(res, 'Failed to fetch campaign status');
  }
};

/**
 * Update campaign status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateCampaignStatus = async (req, res) => {
  try {
    // Get validated ID from the validation middleware
    const { id } = req.validatedParams;
    
    // Get validated data from the validation middleware
    const { status, contractAddress, campaignIndex, tokenAddress } = req.validatedBody;

    // Get user wallet address from authenticated user
    const userWalletAddress = req.user._id;

    // Fetch campaign from database
    const campaign = await Campaign.findById(id);
    
    // Check if campaign exists
    if (!campaign) {
      return notFound(res, 'Campaign not found');
    }

    // Check if user is the campaign founder
    if (campaign.founder !== userWalletAddress) {
      return forbidden(res, 'You do not have permission to update this campaign');
    }

    // Validate status transitions
    if (campaign.status === 'Draft' && status === 'Active') {
      // When activating a campaign, contract address is required
      if (!contractAddress) {
        return badRequest(res, 'Contract address is required to activate a campaign');
      }
      
      // When activating, we need the campaign index from the blockchain
      if (campaignIndex === undefined || campaignIndex === null) {
        return badRequest(res, 'Campaign index from blockchain is required to activate a campaign');
      }
      
      // Update contract-related fields
      campaign.contractAddress = contractAddress;
      campaign.campaignIndex = campaignIndex;
      
      // If token address is provided, update it
      if (tokenAddress) {
        campaign.tokenAddress = tokenAddress;
      }
      
      // Note: At this point, the frontend should have already called the smart contract's
      // createCampaign function with the campaign's metaUrl (which could be the campaign ID)
      // and received the campaign index from the blockchain
      
    } else if (campaign.status === 'Active' && status === 'Draft') {
      // Cannot go back to Draft from Active
      return badRequest(res, 'Cannot change status from Active to Draft');
    } else if (campaign.status === 'Funded' || campaign.status === 'Expired') {
      // Cannot change status once Funded or Expired
      return badRequest(res, `Cannot change status once campaign is ${campaign.status}`);
    }

    // Update campaign status
    campaign.status = status;

    // Save updated campaign
    await campaign.save();

    res.status(200).json(campaign);
  } catch (error) {
    console.error('Error updating campaign status:', error);
    return serverError(res, 'Failed to update campaign status');
  }
};

/**
 * Process campaign withdrawal
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const withdrawCampaignFunds = async (req, res) => {
  try {
    // Get validated ID from the validation middleware
    const { id } = req.validatedParams;
    
    // Get validated data from the validation middleware
    const { transactionHash } = req.validatedBody;

    // Get user wallet address from authenticated user
    const userWalletAddress = req.user._id;

    // Fetch campaign from database
    const campaign = await Campaign.findById(id);
    
    // Check if campaign exists
    if (!campaign) {
      return notFound(res, 'Campaign not found');
    }

    // Check if user is the campaign founder
    if (campaign.founder !== userWalletAddress) {
      return forbidden(res, 'You do not have permission to withdraw funds from this campaign');
    }

    // Check if campaign is funded
    if (campaign.status !== 'Funded') {
      return badRequest(res, 'Only funded campaigns can be withdrawn');
    }

    // Check if there are funds to withdraw
    if (campaign.currentAmount <= 0) {
      return badRequest(res, 'No funds available to withdraw');
    }

    // Record the withdrawal amount
    const withdrawalAmount = campaign.currentAmount;
    
    // Update campaign
    campaign.currentAmount = 0;
    
    // Save updated campaign
    await campaign.save();

    // Note: At this point, the frontend should have already called the smart contract's
    // founderWithdraw function with the campaign index

    res.status(200).json({
      campaign: campaign._id,
      withdrawalAmount,
      transactionHash,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return serverError(res, 'Failed to process withdrawal');
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  getCampaignStatus,
  updateCampaignStatus,
  withdrawCampaignFunds
};