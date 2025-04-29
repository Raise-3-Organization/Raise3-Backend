const { z } = require('zod');
const mongoose = require('mongoose');

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

// Record contract schema
const recordContractSchema = z.object({
  campaignId: z.string().refine(isValidObjectId, { message: 'Invalid campaign ID format' }),
  address: z.string().min(1, 'Contract address is required'),
  type: z.enum(['CampaignFunding', 'TokenSale'], {
    errorMap: () => ({ message: 'Type must be one of: CampaignFunding, TokenSale' })
  }),
  metadata: z.object({}).passthrough().optional()
});

// Contract type parameter schema
const contractTypeSchema = z.object({
  type: z.enum(['CampaignFunding', 'TokenSale'], {
    errorMap: () => ({ message: 'Type must be one of: CampaignFunding, TokenSale' })
  })
});

// Campaign ID parameter schema
const campaignIdSchema = z.object({
  campaignId: z.string().refine(isValidObjectId, { message: 'Invalid campaign ID format' })
});

module.exports = {
  recordContractSchema,
  contractTypeSchema,
  campaignIdSchema
};