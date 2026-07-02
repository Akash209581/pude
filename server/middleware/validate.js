const { body, validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed.', errors: errors.array() });
  }
  return next();
}

const loginRules = [
  body('username').trim().notEmpty().withMessage('Username is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const publicationRules = [
  body('paper_title').trim().notEmpty().withMessage('Paper title is required.'),
  body('conference_or_journal').isIn(['Conference', 'Journal']).withMessage('Choose Conference or Journal.'),
  body('paper_name').trim().notEmpty().withMessage('Conference or journal name is required.'),
  body('paper_type').trim().notEmpty().withMessage('Paper type is required.'),
  body('year').isInt({ min: 1900, max: 2100 }).withMessage('Year must be valid.'),
  body('authors')
    .custom((authors, { req }) => {
      if (Array.isArray(authors) && authors.length > 0) {
        return authors.every((author) => author.student_name?.trim() && author.registration_number?.trim());
      }
      return Boolean(req.body.student_name?.trim() && req.body.registration_number?.trim());
    })
    .withMessage('At least one author with student name and registration number is required.'),
];

const eventRules = [
  body('employee_id').trim().notEmpty().withMessage('Employee ID is required.'),
  body('coordinator_name').trim().notEmpty().withMessage('Coordinator name is required.'),
  body('event_name').trim().notEmpty().withMessage('Event name is required.'),
  body('academic_year').trim().notEmpty().withMessage('Academic year is required.'),
  body('from_date').isISO8601().withMessage('From date is required.'),
  body('to_date').optional({ checkFalsy: true }).isISO8601().withMessage('To date must be a valid date.'),
  body('venue').trim().notEmpty().withMessage('Venue is required.'),
  body('budget').optional({ checkFalsy: true }).isNumeric().withMessage('Budget must be a number.'),
  body('description').trim().notEmpty().withMessage('Description is required.'),
  body('outcome').optional().trim(),
];

module.exports = { handleValidation, loginRules, publicationRules, eventRules };
