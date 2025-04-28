/**
 * Dashboard Controller
 * Handles dashboard data aggregation
 */
const Campaign = require('../models/Campaign');
const Investment = require('../models/Investment');
const { serverError, forbidden } = require('../helpers/error');

/**
 * Get founder dashboard data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFounderDashboard = async (req, res) => {
  try {
    // Get founder wallet address from authenticated user
    const founderWalletAddress = req.user._id;

    // Fetch all campaigns created by the founder
    const campaigns = await Campaign.find({ founder: founderWalletAddress })
      .sort({ createdAt: -1 });

    // Calculate dashboard metrics
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'Active').length;
    const totalFundsRaised = campaigns.reduce((sum, campaign) => sum + campaign.currentAmount, 0);

    // Enhance campaign data with additional metrics
    const enhancedCampaigns = await Promise.all(campaigns.map(async (campaign) => {
      // Get investor count for each campaign
      const investorCount = await Investment.countDocuments({
        campaign: campaign._id,
        status: 'Confirmed'
      });

      // Calculate percentage funded
      const percentageFunded = (campaign.currentAmount / campaign.goalAmount) * 100;

      return {
        _id: campaign._id,
        title: campaign.title,
        status: campaign.status,
        goalAmount: campaign.goalAmount,
        currentAmount: campaign.currentAmount,
        percentageFunded: parseFloat(percentageFunded.toFixed(2)),
        investorCount,
        deadline: campaign.deadline
      };
    }));

    res.status(200).json({
      campaigns: enhancedCampaigns,
      totalCampaigns,
      activeCampaigns,
      totalFundsRaised
    });
  } catch (error) {
    console.error('Error fetching founder dashboard:', error);
    return serverError(res, 'Failed to fetch dashboard data');
  }
};

/**
 * Get investor dashboard data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getInvestorDashboard = async (req, res) => {
  try {
    // Get investor wallet address from authenticated user
    const investorWalletAddress = req.user._id;

    // Fetch all investments made by the investor
    const investments = await Investment.find({ investor: investorWalletAddress })
      .populate('campaign', 'title status goalAmount currentAmount deadline')
      .sort({ createdAt: -1 });

    // Calculate dashboard metrics
    const totalInvestments = investments.length;
    const totalAmountInvested = investments.reduce((sum, inv) => {
      // Only count confirmed investments
      return inv.status === 'Confirmed' ? sum + inv.amount : sum;
    }, 0);
    const activeInvestments = investments.filter(inv => 
      inv.status === 'Confirmed' && inv.campaign.status === 'Active'
    ).length;

    // Format investment data for response
    const formattedInvestments = investments.map(inv => ({
      _id: inv._id,
      campaign: {
        _id: inv.campaign._id,
        title: inv.campaign.title,
        status: inv.campaign.status
      },
      amount: inv.amount,
      status: inv.status,
      date: inv.createdAt
    }));

    res.status(200).json({
      investments: formattedInvestments,
      totalInvestments,
      totalAmountInvested,
      activeInvestments
    });
  } catch (error) {
    console.error('Error fetching investor dashboard:', error);
    return serverError(res, 'Failed to fetch dashboard data');
  }
};

/**
 * Get campaign analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCampaignAnalytics = async (req, res) => {
  try {
    // Get campaign ID from request parameters
    const { id } = req.params;
    
    // Get user wallet address from authenticated user
    const userWalletAddress = req.user._id;
    
    // Fetch campaign
    const campaign = await Campaign.findById(id);
    
    // Check if campaign exists
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Check if user is authorized to view analytics
    // Allow both the founder and investors who have invested in this campaign
    const isFounder = campaign.founder === userWalletAddress;
    
    if (!isFounder) {
      // Check if user is an investor in this campaign
      const investment = await Investment.findOne({
        campaign: id,
        investor: userWalletAddress
      });
      
      if (!investment) {
        return forbidden(res, 'You do not have permission to view this campaign\'s analytics');
      }
    }
    
    // Get all investments in this campaign
    const investments = await Investment.find({ campaign: id });
    
    // Calculate investment statistics
    const totalInvestments = investments.length;
    const confirmedInvestments = investments.filter(inv => inv.status === 'Confirmed').length;
    const totalInvested = investments
      .filter(inv => inv.status === 'Confirmed')
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    // Count unique investors
    const uniqueInvestors = new Set(
      investments
        .filter(inv => inv.status === 'Confirmed')
        .map(inv => inv.investor)
    ).size;
    
    // Calculate funding progress
    const percentageFunded = campaign.goalAmount > 0 
      ? parseFloat(((campaign.currentAmount / campaign.goalAmount) * 100).toFixed(2))
      : 0;
    
    // Calculate time remaining
    const now = new Date();
    const deadline = new Date(campaign.deadline);
    const timeRemainingMs = Math.max(0, deadline - now);
    const daysRemaining = Math.ceil(timeRemainingMs / (1000 * 60 * 60 * 24));
    
    // Calculate funding rate
    const campaignStartDate = new Date(campaign.createdAt);
    const daysSinceStart = Math.max(1, Math.ceil((now - campaignStartDate) / (1000 * 60 * 60 * 24)));
    const fundingRate = parseFloat((campaign.currentAmount / daysSinceStart).toFixed(2));
    
    // Estimate time to full funding
    const remainingAmount = campaign.goalAmount - campaign.currentAmount;
    const estimatedDaysToFullFunding = fundingRate > 0 
      ? Math.ceil(remainingAmount / fundingRate) 
      : null;
    
    // Get investment timeline (simplified)
    const investmentTimeline = investments
      .filter(inv => inv.status === 'Confirmed')
      .map(inv => ({
        date: inv.createdAt,
        amount: inv.amount
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.status(200).json({
      campaignId: campaign._id,
      title: campaign.title,
      status: campaign.status,
      goalAmount: campaign.goalAmount,
      currentAmount: campaign.currentAmount,
      percentageFunded,
      daysRemaining,
      totalInvestments,
      confirmedInvestments,
      uniqueInvestors,
      totalInvested,
      fundingRate,
      estimatedDaysToFullFunding,
      investmentTimeline,
      onChainData: {
        contractAddress: campaign.contractAddress,
        campaignIndex: campaign.campaignIndex,
        tokenAddress: campaign.tokenAddress
      }
    });
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    return serverError(res, 'Failed to fetch campaign analytics');
  }
};

module.exports = {
  getFounderDashboard,
  getInvestorDashboard,
  getCampaignAnalytics
};