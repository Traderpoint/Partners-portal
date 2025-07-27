/**
 * Systrix Middleware - Minimal Test Version
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3004;

// Basic middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'Systrix Middleware',
    version: '2.0.0',
    port: PORT,
    timestamp: new Date().toISOString(),
    status: 'operational'
  });
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Systrix Middleware (minimal) running on http://localhost:${PORT}`);
});

module.exports = app;
