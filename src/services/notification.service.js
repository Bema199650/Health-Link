const axios = require('axios');

class NotificationService {
  // Send SMS via Africa's Talking
  static async sendSMS(phoneNumber, message) {
    try {
      // In production, integrate with Africa's Talking API
      const africastalking = require('africastalking')({
        apiKey: process.env.AT_API_KEY,
        username: process.env.AT_USERNAME
      });
      
      const sms = africastalking.SMS;
      const result = await sms.send({
        to: [phoneNumber],
        message: message,
        from: 'HEALTHLINK'
      });
      
      console.log('SMS sent:', result);
      return result;
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw error;
    }
  }

  // Send WhatsApp message
  static async sendWhatsApp(phoneNumber, message) {
    try {
      // WhatsApp Business API integration
      const response = await axios.post(
        `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "text",
          text: { body: message }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('WhatsApp sending failed:', error);
      throw error;
    }
  }

  // Send USSD notification (push)
  static async sendUSSD(phoneNumber, message) {
    try {
      // USSD push notification (implementation depends on provider)
      console.log(`USSD push to ${phoneNumber}: ${message}`);
      // Implement actual USSD push logic here
      return { success: true, message: 'USSD sent' };
    } catch (error) {
      console.error('USSD push failed:', error);
      throw error;
    }
  }

  // Send notification based on user preference
  static async sendNotification(user, message, type) {
    const notifications = [];
    
    try {
      if (user.preferredChannel === 'sms') {
        notifications.push(await this.sendSMS(user.phoneNumber, message));
      } else if (user.preferredChannel === 'whatsapp') {
        notifications.push(await this.sendWhatsApp(user.phoneNumber, message));
      }
      
      // Always try SMS as fallback
      if (user.preferredChannel !== 'sms') {
        try {
          notifications.push(await this.sendSMS(user.phoneNumber, message));
        } catch (err) {
          console.log('SMS fallback failed');
        }
      }
      
      return notifications;
    } catch (error) {
      console.error('Notification sending failed:', error);
      throw error;
    }
  }

  // Bulk notification for alerts
  static async sendBulkAlert(users, alert) {
    const results = {
      total: users.length,
      sent: 0,
      failed: 0
    };

    for (const user of users) {
      try {
        // Choose appropriate message based on channel
        let message = '';
        if (alert.message.length > 160) {
          message = alert.title + '\n' + alert.message.substring(0, 157) + '...';
        } else {
          message = alert.title + '\n' + alert.message;
        }

        await this.sendNotification(user, message, alert.type);
        results.sent++;
      } catch (error) {
        results.failed++;
        console.error(`Failed to send to ${user.phoneNumber}:`, error);
      }
    }

    return results;
  }
}

module.exports = NotificationService;