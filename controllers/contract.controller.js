/**
 * Contract Controller
 * Handles smart contract interface logic
 */
const Contract = require('../models/Contract');
const Campaign = require('../models/Campaign');
const { badRequest, notFound, forbidden, serverError } = require('../helpers/error');
const path = require('path');
const fs = require('fs');

/**
 * Get contract ABI by type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getContractAbi = (req, res) => {
  try {
    // Get validated type from the validation middleware
    const { type } = req.validatedParams;
    
    // In a real implementation, you would load the ABI from a file or database
    // For now, we'll use a simple switch statement
    let abi;
    
    switch (type) {
      case 'CampaignFunding':
        abi = [
          {
            "inputs": [
              {
                "internalType": "address",
                "name": "_founder",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "_goal",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "_deadline",
                "type": "uint256"
              }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
          },
          {
            "anonymous": false,
            "inputs": [
              {
                "indexed": true,
                "internalType": "address",
                "name": "investor",
                "type": "address"
              },
              {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
              }
            ],
            "name": "FundingReceived",
            "type": "event"
          }
        ];
        break;
      case 'TokenSale':
        abi = [
          {
            "inputs": [
              {
                "internalType": "address",
                "name": "_tokenAddress",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "_tokenPrice",
                "type": "uint256"
              }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
          }
        ];
        break;
      default:
        return badRequest(res, `Unknown contract type: ${type}`);
    }
    
    res.status(200).json({ abi });
  } catch (error) {
    console.error('Error fetching contract ABI:', error);
    return serverError(res, 'Failed to fetch contract ABI');
  }
};

/**
 * Record a deployed contract
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const recordContract = async (req, res) => {
  try {
    // Get validated data from the validation middleware
    const { campaignId, address, type, metadata } = req.validatedBody;
    
    // Get user wallet address from authenticated user
    const userWalletAddress = req.user._id;
    
    // Check if campaign exists and user is the founder
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return notFound(res, 'Campaign not found');
    }
    
    if (campaign.founder !== userWalletAddress) {
      return forbidden(res, 'Only the campaign founder can record a contract');
    }
    
    // Check if a contract already exists for this campaign
    const existingContract = await Contract.findOne({ campaign: campaignId });
    if (existingContract) {
      return badRequest(res, 'A contract is already recorded for this campaign');
    }
    
    // Create new contract
    const contract = new Contract({
      campaign: campaignId,
      address,
      type,
      metadata: metadata || {}
    });
    
    // Save contract to database
    await contract.save();
    
    // Update campaign with contract address
    campaign.contractAddress = address;
    await campaign.save();
    
    res.status(201).json(contract);
  } catch (error) {
    console.error('Error recording contract:', error);
    return serverError(res, 'Failed to record contract');
  }
};

/**
 * Get contract details for a campaign
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getContractByCampaignId = async (req, res) => {
  try {
    // Get validated campaign ID from the validation middleware
    const { campaignId } = req.validatedParams;
    
    // Fetch contract from database
    const contract = await Contract.findOne({ campaign: campaignId });
    
    // Check if contract exists
    if (!contract) {
      return notFound(res, 'No contract found for this campaign');
    }
    
    res.status(200).json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    return serverError(res, 'Failed to fetch contract details');
  }
};

module.exports = {
  getContractAbi,
  recordContract,
  getContractByCampaignId
};