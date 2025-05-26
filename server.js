const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const axios = require('axios');
const path = require('path');
require('dotenv').config();
const PORT = process.env.PORT || 8080;
const account_id=process.env.ACCOUNT_ID;
const authToken= process.env.CAPI_TOKEN;

// Middleware to parse incoming requests
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CAPI-Token, X-Account-ID");
  next();
});

app.get('/diagnostics_tests.html', (req, res) => {
    console.log('get diagnostics_tests');
    res.sendFile(path.join(__dirname, 'public', 'diagnostics_tests.html'));
});

// Route to handle incoming GTM requests
app.post('/trigger', async (req, res) => {
  try {
    const body = req.body;
    console.log("Received body from client (raw):", body);
    console.log("Received body type:", typeof body);

    // Get account ID and CAPI token from headers, fall back to defaults if not provided
    const accountId = req.headers['x-account-id'] || account_id;
    const capiTOKEN = req.headers['x-capi-token'] || authToken;

    // Send event to Reddit CAPI
    const capiResponse = await sendToRedditCAPI(body, accountId, capiTOKEN);
    console.log('CAPI Response:', capiResponse);

    res.json({ success: true, message: 'Events processed successfully' });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update the sendToRedditCAPI function to use the provided account ID and auth token
async function sendToRedditCAPI(event, accountId, authToken) {
  const capiUrl = `https://ads-api.reddit.com/api/v2.0/conversions/events/${accountId}`;

  console.log("Event being sent to CAPI:", event);
  console.log("Event type:", typeof event);
  console.log("Sending to account ID:", accountId);
  
  const requestBody = JSON.stringify(event);
  console.log("Stringified request body:", requestBody);

  const response = await fetch(capiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: requestBody
  });

  const responseText = await response.text();
  console.log("Raw response text:", responseText);

  if (!response.ok) {
    try {
      const error = JSON.parse(responseText);
      throw new Error(`CAPI request failed: ${error.message || response.statusText}`);
    } catch (parseError) {
      throw new Error(`CAPI request failed: ${responseText}`);
    }
  }

  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    console.error("Failed to parse response:", parseError);
    throw new Error(`Failed to parse CAPI response: ${responseText}`);
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
