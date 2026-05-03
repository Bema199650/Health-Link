const Alert = require('../models/Alert.model');
const User = require('../models/User.model');
const NotificationService = require('../services/notification.service');

class AlertController {
  // Create new alert
  static async createAlert(req, res) {
    try {
      const alertData = {
        ...req.body,
        createdBy: req.user._id
      };

      const alert = await Alert.create(alertData);

      // If send now is true, trigger sending
      if (alert.schedule.sendNow) {
        // Send in background
        AlertController.sendAlert(alert._id).catch(console.error);
      }

      res.status(201).json({
        success: true,
        data: alert
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create alert',
        error: error.message
      });
    }
  }

  // Send alert
  static async sendAlert(alertId) {
    try {
      const alert = await Alert.findById(alertId);
      
      if (!alert) {
        throw new Error('Alert not found');
      }

      // Build user query based on target audience
      const userQuery = {};
      
      if (alert.targetAudience.districts && alert.targetAudience.districts.length > 0) {
        userQuery.district = { $in: alert.targetAudience.districts };
      }
      
      if (alert.targetAudience.userRoles && !alert.targetAudience.userRoles.includes('all')) {
        userQuery.role = { $in: alert.targetAudience.userRoles };
      }

      const users = await User.find(userQuery);

      // Update alert status
      alert.status = 'sending';
      alert.sentCount = users.length;
      await alert.save();

      // Send notifications
      const results = await NotificationService.sendBulkAlert(users, alert);

      // Update alert with results
      alert.status = 'sent';
      alert.deliveredCount = results.sent;
      alert.failedCount = results.failed;
      await alert.save();

      return results;
    } catch (error) {
      console.error('Alert sending failed:', error);
      
      // Update alert status to failed
      await Alert.findByIdAndUpdate(alertId, { status: 'failed' });
      
      throw error;
    }
  }

  // Get all alerts
  static async getAlerts(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const alerts = await Alert.find()
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Alert.countDocuments();

      res.json({
        success: true,
        data: alerts,
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
        message: 'Failed to fetch alerts',
        error: error.message
      });
    }
  }

  // Get alert by ID
  static async getAlertById(req, res) {
    try {
      const alert = await Alert.findById(req.params.id).populate('createdBy', 'name');

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
      }

      res.json({
        success: true,
        data: alert
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch alert',
        error: error.message
      });
    }
  }

  // Schedule alert
  static async scheduleAlert(req, res) {
    try {
      const { alertId, scheduledTime } = req.body;

      const alert = await Alert.findByIdAndUpdate(alertId, {
        'schedule.sendNow': false,
        'schedule.scheduledTime': new Date(scheduledTime),
        status: 'scheduled'
      }, { new: true });

      res.json({
        success: true,
        message: 'Alert scheduled successfully',
        data: alert
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to schedule alert',
        error: error.message
      });
    }
  }
}

module.exports = AlertController;