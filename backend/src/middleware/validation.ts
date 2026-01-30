import { Request, Response, NextFunction } from 'express';
import { validationResult, body, param, query } from 'express-validator';

export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
    return;
  }
  next();
};

// Auth validation rules
export const loginValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .escape(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .escape(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
];

// Organization validation
export const organizationValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .escape(),
  body('sector')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Sector must be between 2 and 50 characters')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
    .escape(),
  body('stakeholderName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .escape(),
  body('stakeholderEmail')
    .optional()
    .isEmail()
    .withMessage('Valid stakeholder email required')
    .normalizeEmail(),
];

// PIR validation
export const pirValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters')
    .escape(),
  body('priority')
    .isIn(['High', 'Medium', 'Low'])
    .withMessage('Priority must be High, Medium, or Low'),
  body('status')
    .isIn(['Active', 'Draft', 'Archived'])
    .withMessage('Status must be Active, Draft, or Archived'),
  body('organizationId')
    .isUUID()
    .withMessage('Valid organization ID required'),
];

// Source validation
export const sourceValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .escape(),
  body('type')
    .isIn(['Internal', 'OSINT', 'FeedComercial', 'FeedAberto', 'DarkWeb'])
    .withMessage('Invalid source type'),
  body('credibility')
    .isIn(['A', 'B', 'C', 'D', 'E', 'F'])
    .withMessage('Credibility must be A-F'),
  body('reliability')
    .isIn(['A', 'B', 'C', 'D', 'E', 'F'])
    .withMessage('Reliability must be A-F'),
  body('pirId')
    .isUUID()
    .withMessage('Valid PIR ID required'),
];

// Report validation
export const reportValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .escape(),
  body('type')
    .isIn(['Strategic', 'Operational', 'Tactical'])
    .withMessage('Type must be Strategic, Operational, or Tactical'),
  body('content')
    .trim()
    .isLength({ min: 10, max: 50000 })
    .withMessage('Content must be between 10 and 50000 characters'),
  body('pirId')
    .isUUID()
    .withMessage('Valid PIR ID required'),
];

// Dissemination validation
export const disseminationValidation = [
  body('type')
    .isIn(['Strategic', 'Operational', 'Tactical'])
    .withMessage('Type must be Strategic, Operational, or Tactical'),
  body('status')
    .isIn(['Pending', 'Disseminated', 'Acknowledged'])
    .withMessage('Status must be Pending, Disseminated, or Acknowledged'),
  body('reportName')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Report name must be between 2 and 200 characters')
    .escape(),
  body('pirId')
    .isUUID()
    .withMessage('Valid PIR ID required'),
];

// Metric validation
export const metricValidation = [
  body('pirId')
    .isUUID()
    .withMessage('Valid PIR ID required'),
  body('hasIncident')
    .isBoolean()
    .withMessage('hasIncident must be boolean'),
  body('discoveryDate')
    .isISO8601()
    .withMessage('Valid discovery date required'),
  body('disseminationDate')
    .isISO8601()
    .withMessage('Valid dissemination date required'),
  body('impactScale')
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Impact scale must be Low, Medium, High, or Critical'),
];

// UUID param validation
export const uuidParam = (paramName: string) => [
  param(paramName)
    .isUUID()
    .withMessage(`Valid ${paramName} UUID required`),
];

// Pagination query validation
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];
