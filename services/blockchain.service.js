/**
 * Blockchain Service
 * Handles blockchain event listening and synchronization
 */
const Campaign = require('../models/Campaign');
const Investment = require('../models/Investment');
const User = require('../models/User');

/**
 * Initialize blockchain event listeners
 * This would be called when the server starts
 */
const initializeEventListeners = async () => {
  try {
    console.log('Initializing blockchain event listeners...');
    
    // In a real implementation, you would:
    // 1. Connect to an Ethereum node using ethers.js or web3.js
    // 2. Create contract instances for your deployed contracts
    // 3. Set up event listeners for relevant events
    
    // Example (pseudocode):
    // const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    // const contract = new ethers.Contract(contractAddress, contractAbi, provider);
    // 
    // contract.on('CampaignCreated', handleCampaignCreated);
    // contract.on('Invested', handleInvestment);
    // contract.on('FundsWithdrawn', handleFundsWithdrawn);
    
    console.log('Blockchain event listeners initialized successfully');
  } catch (error) {
    console.error('Error initializing blockchain event listeners:', error);
  }
};

/**
 * Handle CampaignCreated event from the blockchain
 * @param {Number} campaignId - Campaign ID from the blockchain
 * @param {String} metaUrl - Metadata URL
 * @param {Number} goalAmount - Goal amount
 * @param {String} founder - Founder address
 */
const handleCampaignCreated = async (campaignId, metaUrl, goalAmount, founder) => {
  try {
    // Extract campaign ID from metaUrl
    // Assuming metaUrl format is: https://api.raise3.io/api/campaigns/:id
    const parts = metaUrl.split('/');
    const backendCampaignId = parts[parts.length - 1];
    
    // Update campaign in database with blockchain campaignId
    await Campaign.findByIdAndUpdate(backendCampaignId, {
      campaignIndex: campaignId,
      status: 'Active'
    });
    
    console.log(`Campaign ${backendCampaignId} updated with blockchain index ${campaignId}`);
  } catch (error) {
    console.error('Error handling CampaignCreated event:', error);
  }
};

/**
 * Handle Invested event from the blockchain
 * @param {Number} campaignId - Campaign ID from the blockchain
 * @param {String} investor - Investor address
 * @param {Number} amount - Investment amount
 */
const handleInvestment = async (campaignId, investor, amount) => {
  try {
    // Find campaign by blockchain campaignId
    const campaign = await Campaign.findOne({ campaignIndex: campaignId });
    
    if (!campaign) {
      console.error(`Campaign with blockchain index ${campaignId} not found`);
      return;
    }
    
    // Check if investment already exists
    const existingInvestment = await Investment.findOne({
      campaign: campaign._id,
      investor,
      amount
    });
    
    if (existingInvestment) {
      // Update existing investment
      existingInvestment.status = 'Confirmed';
      await existingInvestment.save();
    } else {
      // Create new investment record
      const investment = new Investment({
        investor,
        campaign: campaign._id,
        amount,
        status: 'Confirmed'
      });
      
      await investment.save();
    }
    
    // Update campaign's current amount
    campaign.currentAmount += amount;
    
    // Check if campaign is now fully funded
    if (campaign.currentAmount >= campaign.goalAmount) {
      campaign.status = 'Funded';
    }
    
    await campaign.save();
    
    console.log(`Investment recorded for campaign ${campaign._id} from ${investor}`);
  } catch (error) {
    console.error('Error handling Invested event:', error);
  }
};

/**
 * Handle FundsWithdrawn event from the blockchain
 * @param {Number} campaignId - Campaign ID from the blockchain
 * @param {String} founder - Founder address
 * @param {Number} amount - Withdrawn amount
 */
const handleFundsWithdrawn = async (campaignId, founder, amount) => {
  try {
    // Find campaign by blockchain campaignId
    const campaign = await Campaign.findOne({ campaignIndex: campaignId });
    
    if (!campaign) {
      console.error(`Campaign with blockchain index ${campaignId} not found`);
      return;
    }
    
    // Update campaign
    campaign.currentAmount = 0; // All funds withdrawn
    await campaign.save();
    
    console.log(`Funds withdrawn for campaign ${campaign._id} by ${founder}`);
  } catch (error) {
    console.error('Error handling FundsWithdrawn event:', error);
  }
};

/**
 * Sync campaign data from blockchain
 * This would be called periodically or on-demand
 */
const syncCampaignData = async () => {
  try {
    console.log('Syncing campaign data from blockchain...');
    
    // In a real implementation, you would:
    // 1. Connect to an Ethereum node
    // 2. Get the total number of campaigns from the contract
    // 3. For each campaign, get details from the contract
    // 4. Update the database with the latest data
    
    // Example (pseudocode):
    // const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    // const contract = new ethers.Contract(contractAddress, contractAbi, provider);
    // 
    // const campaignCount = await contract.getCampaignLen();
    // 
    // for (let i = 0; i < campaignCount; i++) {
    //   const [metaUrl, goalAmount, totalRaised, founder, token] = await contract.getCampaignDetails(i);
    //   // Update database
    // }
    
    console.log('Campaign data synced successfully');
  } catch (error) {
    console.error('Error syncing campaign data:', error);
  }
};

module.exports = {
  initializeEventListeners,
  handleCampaignCreated,
  handleInvestment,
  handleFundsWithdrawn,
  syncCampaignData
};