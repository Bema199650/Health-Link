const Complaint = require('../models/Complaint.model');
const User = require('../models/User.model');
const NotificationService = require('../services/notification.service');

class PatientFeedbackController {
  // Submit a complaint
  static async submitComplaint(req, res) {
    try {
      const { category, description, healthFacility, channel, isAnonymous } = req.body;
      
      // Find or create user
      let user = req.user;
      if (isAnonymous) {
        user = await User.findOne({ phoneNumber: 'anonymous' });
        if (!user) {
          user = await User.create({
            phoneNumber: 'anonymous',
            name: 'Anonymous User',
            role: 'patient'
          });
        }
      }

      const complaint = await Complaint.create({
        user: user._id,
        category,
        description,
        healthFacility,
        channel: channel || 'web',
        isAnonymous: isAnonymous || false
      });

      // Send confirmation
      const message = `Thank you for your feedback! Your ticket ID is ${complaint.ticketId}. We will respond within 24 hours.`;
      
      if (user.preferredChannel === 'whatsapp') {
        await NotificationService.sendWhatsApp(user.phoneNumber, message);
      } else {
        await NotificationService.sendSMS(user.phoneNumber, message);
      }

      res.status(201).json({
        success: true,
        data: {
          ticketId: complaint.ticketId,
          message: 'Complaint submitted successfully'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to submit complaint',
        error: error.message
      });
    }
  }

  // Get user's complaints
  static async getUserComplaints(req, res) {
    try {
      const complaints = await Complaint.find({ user: req.user._id })
        .sort('-createdAt')
        .limit(20);

      res.json({
        success: true,
        count: complaints.length,
        data: complaints
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch complaints',
        error: error.message
      });
    }
  }

  // Get complaint status
  static async getComplaintStatus(req, res) {
    try {
      const { ticketId } = req.params;
      
      const complaint = await Complaint.findOne({ ticketId })
        .populate('user', 'name phoneNumber');

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: 'Complaint not found'
        });
      }

      res.json({
        success: true,
        data: {
          ticketId: complaint.ticketId,
          status: complaint.status,
          category: complaint.category,
          createdAt: complaint.createdAt,
          response: complaint.response
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch complaint status',
        error: error.message
      });
    }
  }

  // Admin: Get all complaints
  static async getAllComplaints(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status;

      let query = {};
      if (status) {
        query.status = status;
      }

      const complaints = await Complaint.find(query)
        .populate('user', 'name phoneNumber')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Complaint.countDocuments(query);

      res.json({
        success: true,
        data: complaints,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch complaints',
        error: error.message
      });
    }
  }

  // Admin: Respond to complaint
  static async respondToComplaint(req, res) {
    try {
      const { ticketId } = req.params;
      const { message } = req.body;

      const complaint = await Complaint.findOne({ ticketId });
      
      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: 'Complaint not found'
        });
      }

      complaint.response = {
        message,
        respondedBy: req.user._id,
        respondedAt: new Date()
      };
      complaint.status = 'resolved';

      await complaint.save();

      // Notify the user
      const user = await User.findById(complaint.user);
      const notificationMsg = `Your complaint (${ticketId}) has been resolved: ${message}`;
      await NotificationService.sendNotification(user, notificationMsg, 'complaint_response');

      res.json({
        success: true,
        message: 'Response sent successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to respond to complaint',
        error: error.message
      });
    }
  }
}

module.exports = PatientFeedbackController;