/**
 * Validation middleware using Zod schemas
 */

/**
 * Validate request body against a Zod schema
 * @param {Object} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
const validateBody = (schema) => (req, res, next) => {
  try {
    const validatedData = schema.parse(req.body);
    req.validatedBody = validatedData;
    next();
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({
        errors: error.errors.map(err => ({
          error: `${err.path.join('.')}: ${err.message}`
        }))
      });
    }
    return res.status(400).json({
      errors: [{ error: 'Validation failed' }]
    });
  }
};

/**
 * Validate request parameters against a Zod schema
 * @param {Object} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
const validateParams = (schema) => (req, res, next) => {
  try {
    const validatedData = schema.parse(req.params);
    req.validatedParams = validatedData;
    next();
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({
        errors: error.errors.map(err => ({
          error: `${err.path.join('.')}: ${err.message}`
        }))
      });
    }
    return res.status(400).json({
      errors: [{ error: 'Invalid parameters' }]
    });
  }
};

/**
 * Validate request query against a Zod schema
 * @param {Object} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
const validateQuery = (schema) => (req, res, next) => {
  try {
    const validatedData = schema.parse(req.query);
    req.validatedQuery = validatedData;
    next();
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({
        errors: error.errors.map(err => ({
          error: `${err.path.join('.')}: ${err.message}`
        }))
      });
    }
    return res.status(400).json({
      errors: [{ error: 'Invalid query parameters' }]
    });
  }
};

module.exports = {
  validateBody,
  validateParams,
  validateQuery
};