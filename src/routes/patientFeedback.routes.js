const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const PatientFeedbackController = require('../controllers/patientFeedback.controller');
const { protect, authorize } = require('../middleware/auth');

// Submit complaint
router.post('/',
  protect,
  [
    body('category').isIn(['waiting_time', 'staff_attitude', 'drug_availability', 'equipment', 'cleanliness', 'discrimination', 'other']),
    body('description').isLength({ min: 10, max: 500 }),
    body('channel').isIn(['ussd', 'sms', 'whatsapp', 'web'])
  ],
  PatientFeedbackController.submitComplaint
);

// Get user's complaints
router.get('/my-complaints',
  protect,
  PatientFeedbackController.getUserComplaints
);

// Get complaint status
router.get('/status/:ticketId',
  PatientFeedbackController.getComplaintStatus
);

// Admin routes
router.get('/all',
  protect,
  authorize('dho_admin', 'super_admin'),
  PatientFeedbackController.getAllComplaints
);

router.put('/respond/:ticketId',
  protect,
  authorize('dho_admin', 'super_admin'),
  [
    body('message').isLength({ min: 10, max: 500 })
  ],
  PatientFeedbackController.respondToComplaint
);

module.exports = router;