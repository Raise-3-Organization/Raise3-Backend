/**
 * Analytics Service
 * Provides analytics and dashboard data for investors and founders
 */
const Campaign = require('../models/Campaign');
const Investment = require('../models/Investment');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Get investor dashboard data
 * @param {String} investorAddress - Investor wallet address
 * @returns {Object} Dashboard data
 */
const getInvestorDashboard = async (investorAddress) => {
  try {
    // Get all investments by this investor
    const investments = await Investment.find({ investor: investorAddress })
      .populate('campaign', 'title description goalAmount currentAmount status deadline');
    
    // Calculate total invested amount
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    
    // Count active investments
    const activeInvestments = investments.filter(inv => 
      inv.campaign.status === 'Active' || inv.campaign.status === 'Funded'
    ).length;
    
    // Group investments by status
    const investmentsByStatus = {
      Pending: investments.filter(inv => inv.status === 'Pending').length,
      Confirmed: investments.filter(inv => inv.status === 'Confirmed').length,
      Refunded: investments.filter(inv => inv.status === 'Refunded').length
    };
    
    // Group investments by campaign status
    const investmentsByCampaignStatus = {
      Draft: investments.filter(inv => inv.campaign.status === 'Draft').length,
      Active: investments.filter(inv => inv.campaign.status === 'Active').length,
      Funded: investments.filter(inv => inv.campaign.status === 'Funded').length,
      Expired: investments.filter(inv => inv.campaign.status === 'Expired').length
    };
    
    // Calculate ROI potential (simplified)
    const roiPotential = investments
      .filter(inv => inv.status === 'Confirmed')
      .reduce((sum, inv) => {
        // This is a placeholder calculation
        // In a real implementation, you would calculate based on campaign terms
        return sum + (inv.amount * 0.2); // Assuming 20% return
      }, 0);
    
    return {
      totalInvested,
      activeInvestments,
      totalInvestments: investments.length,
      investmentsByStatus,
      investmentsByCampaignStatus,
      roiPotential,
      recentInvestments: investments.slice(0, 5) // Last 5 investments
    };
  } catch (error) {
    console.error('Error generating investor dashboard:', error);
    throw error;
  }
};

/**
 * Get founder dashboard data
 * @param {String} founderAddress - Founder wallet address
 * @returns {Object} Dashboard data
 */
const getFounderDashboard = async (founderAddress) => {
  try {
    // Get all campaigns by this founder
    const campaigns = await Campaign.find({ founder: founderAddress });
    
    // Get all investments in these campaigns
    const campaignIds = campaigns.map(c => c._id);
    const investments = await Investment.find({ campaign: { $in: campaignIds } });
    
    // Calculate total raised amount
    const totalRaised = campaigns.reduce((sum, camp) => sum + camp.currentAmount, 0);
    
    // Count active campaigns
    const activeCampaigns = campaigns.filter(camp => camp.status === 'Active').length;
    
    // Group campaigns by status
    const campaignsByStatus = {
      Draft: campaigns.filter(camp => camp.status === 'Draft').length,
      Active: campaigns.filter(camp => camp.status === 'Active').length,
      Funded: campaigns.filter(camp => camp.status === 'Funded').length,
      Expired: campaigns.filter(camp => camp.status === 'Expired').length
    };
    
    // Count unique investors
    const uniqueInvestors = new Set(investments.map(inv => inv.investor)).size;
    
    // Calculate funding progress
    const fundingProgress = campaigns.map(camp => ({
      campaignId: camp._id,
      title: camp.title,
      goalAmount: camp.goalAmount,
      currentAmount: camp.currentAmount,
      percentageFunded: (camp.currentAmount / camp.goalAmount) * 100,
      status: camp.status
    }));
    
    return {
      totalRaised,
      activeCampaigns,
      totalCampaigns: campaigns.length,
      campaignsByStatus,
      uniqueInvestors,
      totalInvestments: investments.length,
      fundingProgress,
      recentCampaigns: campaigns.slice(0, 5) // Last 5 campaigns
    };
  } catch (error) {
    console.error('Error generating founder dashboard:', error);
    throw error;
  }
};

/**
 * Get campaign analytics
 * @param {String} campaignId - Campaign ID
 * @returns {Object} Campaign analytics
 */
const getCampaignAnalytics = async (campaignId) => {
  try {
    // Get campaign details
    const campaign = await Campaign.findById(campaignId);
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    
    // Get all investments in this campaign
    const investments = await Investment.find({ campaign: campaignId });
    
    // Calculate investment statistics
    const totalInvestments = investments.length;
    const confirmedInvestments = investments.filter(inv => inv.status === 'Confirmed').length;
    const averageInvestment = totalInvestments > 0 
      ? investments.reduce((sum, inv) => sum + inv.amount, 0) / totalInvestments 
      : 0;
    
    // Count unique investors
    const uniqueInvestors = new Set(investments.map(inv => inv.investor)).size;
    
    // Calculate funding progress
    const percentageFunded = campaign.goalAmount > 0 
      ? (campaign.currentAmount / campaign.goalAmount) * 100 
      : 0;
    
    // Calculate time remaining
    const now = new Date();
    const deadline = new Date(campaign.deadline);
    const timeRemainingMs = Math.max(0, deadline - now);
    const daysRemaining = Math.ceil(timeRemainingMs / (1000 * 60 * 60 * 24));
    
    // Calculate funding rate
    const campaignStartDate = new Date(campaign.createdAt);
    const daysSinceStart = Math.max(1, Math.ceil((now - campaignStartDate) / (1000 * 60 * 60 * 24)));
    const fundingRate = campaign.currentAmount / daysSinceStart;
    
    // Estimate time to full funding
    const remainingAmount = campaign.goalAmount - campaign.currentAmount;
    const estimatedDaysToFullFunding = fundingRate > 0 
      ? Math.ceil(remainingAmount / fundingRate) 
      : null;
    
    return {
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
      averageInvestment,
      fundingRate,
      estimatedDaysToFullFunding
    };
  } catch (error) {
    console.error('Error generating campaign analytics:', error);
    throw error;
  }
};

module.exports = {
  getInvestorDashboard,
  getFounderDashboard,
  getCampaignAnalytics
};