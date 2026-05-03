class WhatsAppService {
  static async sendMessage(phoneNumber, message) {
    console.log(`💬 WhatsApp to ${phoneNumber}: ${message}`);
    
    return {
      success: true,
      messageId: `WA-${Date.now()}`,
      to: phoneNumber,
      status: 'sent'
    };
  }

  static async sendBulkMessages(phoneNumbers, message) {
    console.log(`💬 Sending bulk WhatsApp to ${phoneNumbers.length} recipients`);
    
    return {
      success: true,
      total: phoneNumbers.length,
      sent: phoneNumbers.length,
      failed: 0
    };
  }
}

module.exports = WhatsAppService;