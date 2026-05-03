const express = require('express');
const router = express.Router();
const USSDService = require('../services/ussd.service');

// USSD callback endpoint
router.post('/', async (req, res) => {
  try {
    const { sessionId, phoneNumber, text, serviceCode } = req.body;
    
    console.log('USSD Request:', {
      sessionId,
      phoneNumber,
      text,
      serviceCode
    });

    // Process USSD request
    const response = await USSDService.handleRequest(
      sessionId,
      phoneNumber,
      text,
      serviceCode
    );

    // Set proper content type for USSD
    res.set('Content-Type', 'text/plain');
    res.send(response);
  } catch (error) {
    console.error('USSD Route Error:', error);
    res.set('Content-Type', 'text/plain');
    res.send('END Service temporarily unavailable. Please try again.');
  }
});

// USSD test endpoint (for development)
router.get('/test', (req, res) => {
  res.json({
    message: 'HealthLink Malawi USSD Service',
    shortCode: process.env.AT_SHORT_CODE || '*224#',
    endpoints: {
      main: 'POST /api/ussd/',
      description: 'Main USSD callback endpoint for Africa\'s Talking'
    }
  });
});

module.exports = router;