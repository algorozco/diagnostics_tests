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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.get('/index.html', (req, res) => {
    console.log('get index');
    res.sendFile(path.join(__dirname, 'public', 'diagnostics_tests.html'));
});

// Route to handle incoming GTM requests
app.post('/trigger', async (req, res) => {
    try {
        const data = req.body; // Data sent from frontend
        var capi_response = await triggerCAPIreq(data, authToken,account_id);
        res.status(200).send(capi_response); // Send a 200 OK response
    } catch (error) {
        console.error('Error processing data:', error);
        res.status(500).send('Error'); // Send a 500 Error response
    }
});

async function triggerCAPIreq(data, authToken,account_id) {
  const endpoint = 'https://ads-api.reddit.com/api/v2.0/conversions/events/'+account_id;
  const event_data = data;

  // Send a POST request with the authorization header
  try {
    const response = await axios.post(endpoint, event_data, {
      headers: {
        'Authorization': `Bearer ${authToken}` // Or the appropriate format for your auth token
      }
    });
    //console.log('CAPI Response:', response.data);
    return response.data; // Return the response data for further processing
  } catch (error) {
    console.error('Error in CAPI request:', error.response ? error.response.data : error);
    //Handle error appropriately, maybe throw or return an error object
    return null; //Or throw error;
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
