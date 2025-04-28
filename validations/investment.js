const { z } = require('zod');
const mongoose = require('mongoose');

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

// Record investment schema
const recordInvestmentSchema = z.object({
  campaignId: z.string().refine(isValidObjectId, { message: 'Invalid campaign ID format' }),
  amount: z.number().positive('Investment amount must be greater than 0'),
  transactionHash: z.string().optional()
});

// Investment ID parameter schema
const investmentIdSchema = z.object({
  id: z.string().refine(isValidObjectId, { message: 'Invalid investment ID format' })
});

// Update investment status schema
const updateInvestmentStatusSchema = z.object({
  status: z.enum(['Pending', 'Confirmed', 'Refunded'], {
    errorMap: () => ({ message: 'Status must be one of: Pending, Confirmed, Refunded' })
  }),
  transactionHash: z.string().optional()
});

// Investment query parameters schema
const investmentQuerySchema = z.object({
  status: z.enum(['Pending', 'Confirmed', 'Refunded']).optional(),
  campaignId: z.string().refine(isValidObjectId, { message: 'Invalid campaign ID format' }).optional()
});

module.exports = {
  recordInvestmentSchema,
  investmentIdSchema,
  updateInvestmentStatusSchema,
  investmentQuerySchema
};