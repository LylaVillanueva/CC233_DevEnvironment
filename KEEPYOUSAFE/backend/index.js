const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://safe-iot-cc63a-default-rtdb.firebaseio.com"
});

const db = admin.database();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500']
}));
app.use(express.json());

// API Endpoints
app.get('/api/latest', async (req, res) => {
  try {
    const snapshot = await db.ref("logs")
      .orderByChild("timestamp")
      .limitToLast(1)
      .once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ error: "No data available" });
    }

    const data = snapshot.val();
    const latestKey = Object.keys(data)[0];
    const latestData = data[latestKey];

    res.json({
      airQuality: latestData.airQuality ?? null,
      gas: latestData.gas ?? latestData.gam ?? null, // Handle both gas/gam fields
      airStatus: latestData.airStatus || "unknown",
      gasStatus: latestData.gasStatus || "unknown",
      datetime: latestData.datetime || new Date().toISOString()
    });

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Updated history endpoint
app.get('/api/history', async (req, res) => {
  try {
    const { range = '24', type = 'all' } = req.query;
    const hours = parseInt(range);
    const nowSeconds = Math.floor(Date.now() / 1000); // Current time in seconds
    const cutoffSeconds = range === 'all' ? 0 : nowSeconds - (hours * 60 * 60);

    // Get all logs (we'll filter manually due to timestamp format issues)
    const snapshot = await db.ref("logs").once("value");
    const data = snapshot.val() || {};

    // Transform and filter data
    const historyData = Object.keys(data)
      .map(key => {
        const entry = data[key];
        return {
          id: key,
          airQuality: entry.airQuality,
          gas: entry.gas ?? entry.gam,
          airStatus: entry.airStatus,
          gasStatus: entry.gasStatus,
          datetime: entry.datetime || new Date(entry.timestamp * 1000).toISOString(),
          timestamp: entry.timestamp
        };
      })
      // Filter by time range (comparing seconds with seconds)
      .filter(entry => range === 'all' || entry.timestamp >= cutoffSeconds)
      // Sort by timestamp (newest first)
      .sort((a, b) => b.timestamp - a.timestamp);

    res.json(historyData);

  } catch (error) {
    console.error("History API Error:", error);
    res.status(500).json({ 
      error: "Failed to fetch history data",
      details: error.message 
    });
  }
});

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend/public')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Endpoints:`);
  console.log(`- GET /api/latest`);
  console.log(`- GET /api/history?range=24&type=all`);
});