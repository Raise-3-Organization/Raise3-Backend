const { z } = require('zod');
const mongoose = require('mongoose');

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

// Create campaign schema
const createCampaignSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  goalAmount: z.number().positive('Goal amount must be greater than 0'),
  deadline: z.string().refine(
    (value) => {
      const date = new Date(value);
      return !isNaN(date.getTime()) && date > new Date();
    },
    { message: 'Deadline must be a valid future date' }
  ),
  files: z.array(z.string().refine(isValidObjectId, { message: 'Invalid file ID' })).optional()
});

// Update campaign schema
const updateCampaignSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').max(100, 'Title cannot exceed 100 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters long').optional(),
  goalAmount: z.number().positive('Goal amount must be greater than 0').optional(),
  deadline: z.string().refine(
    (value) => {
      const date = new Date(value);
      return !isNaN(date.getTime()) && date > new Date();
    },
    { message: 'Deadline must be a valid future date' }
  ).optional(),
  files: z.array(z.string().refine(isValidObjectId, { message: 'Invalid file ID' })).optional()
});

// Campaign ID parameter schema
const campaignIdSchema = z.object({
  id: z.string().refine(isValidObjectId, { message: 'Invalid campaign ID format' })
});

// Update campaign status schema
const updateCampaignStatusSchema = z.object({
  status: z.enum(['Draft', 'Active', 'Funded', 'Expired'], {
    errorMap: () => ({ message: 'Status must be one of: Draft, Active, Funded, Expired' })
  }),
  contractAddress: z.string().optional()
});

// Campaign query parameters schema
const campaignQuerySchema = z.object({
  status: z.enum(['Draft', 'Active', 'Funded', 'Expired']).optional(),
  founder: z.string().optional(),
  limit: z.string().transform(val => parseInt(val)).pipe(
    z.number().positive('Limit must be a positive number')
  ).optional().default('10'),
  page: z.string().transform(val => parseInt(val)).pipe(
    z.number().positive('Page must be a positive number')
  ).optional().default('1')
});

module.exports = {
  createCampaignSchema,
  updateCampaignSchema,
  campaignIdSchema,
  updateCampaignStatusSchema,
  campaignQuerySchema
};