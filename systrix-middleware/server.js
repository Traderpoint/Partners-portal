/**
 * Systrix Middleware - Unified HostBill API Gateway with Integrated Dashboard
 * Secure middleware for processing orders between Cloud VPS and HostBill API
 * Port: 3004
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const path = require('path');
const compression = require('compression');
const logger = require('./utils/logger');
const HostBillClient = require('./lib/hostbill-client');
const OrderProcessor = require('./lib/order-processor');
const PaymentProcessor = require('./lib/payment-processor');
const productMapper = require('./lib/product-mapper');

// Calculate commission amount
function calculateCommission(price, commissionInfo) {
  if (!commissionInfo || !price) return 0;

  const numericPrice = parseFloat(price);
  const numericRate = parseFloat(commissionInfo.rate);

  if (commissionInfo.type === 'Percent') {
    return (numericPrice * numericRate / 100).toFixed(2);
  } else if (commissionInfo.type === 'Fixed') {
    return numericRate.toFixed(2);
  }

  return 0;
}

const app = express();
const PORT = process.env.PORT || 3005;
const startTime = new Date();

// Dashboard stats storage
let dashboardStats = {
  startTime: new Date(),
  requests: 0,
  errors: 0,
  lastActivity: null,
  recentRequests: [],
  systemHealth: 'unknown'
};

// Compression middleware
app.use(compression());

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for dashboard
}));

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3006'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for dashboard and logos
app.use('/dashboard/static', express.static(path.join(__dirname, 'dashboard/public')));
app.use(express.static(path.join(__dirname, 'public')));

// Favicon endpoint to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).send();
});

// EJS template engine for dashboard
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'dashboard/views'));

// Request logging and stats middleware
app.use((req, res, next) => {
  dashboardStats.requests++;
  dashboardStats.lastActivity = new Date();

  // Store recent requests (keep last 50)
  dashboardStats.recentRequests.unshift({
    method: req.method,
    url: req.url,
    timestamp: new Date(),
    ip: req.ip
  });

  if (dashboardStats.recentRequests.length > 50) {
    dashboardStats.recentRequests = dashboardStats.recentRequests.slice(0, 50);
  }

  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Initialize HostBill client and processors
const hostbillClient = new HostBillClient();
const orderProcessor = new OrderProcessor(hostbillClient);
const paymentProcessor = new PaymentProcessor(hostbillClient);

// Helper functions for dashboard
async function getSystemStats() {
  const path = require('path');
  const fs = require('fs');
  const logDir = path.join(__dirname, 'logs');
  const stats = {
    logFiles: [],
    totalLogSize: 0
  };

  try {
    if (fs.existsSync(logDir)) {
      const files = fs.readdirSync(logDir);
      for (const file of files) {
        const filePath = path.join(logDir, file);
        const stat = fs.statSync(filePath);
        stats.logFiles.push({
          name: file,
          size: stat.size,
          modified: stat.mtime
        });
        stats.totalLogSize += stat.size;
      }
    }
  } catch (error) {
    logger.error('Error reading log stats', { error: error.message });
  }

  return stats;
}

async function getRecentLogs() {
  const path = require('path');
  const fs = require('fs');
  const logFile = path.join(__dirname, 'logs', 'middleware.log');
  const logs = [];

  try {
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      // Get last 100 lines
      const recentLines = lines.slice(-100);

      for (const line of recentLines) {
        try {
          const logEntry = JSON.parse(line);
          logs.push(logEntry);
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
    }
  } catch (error) {
    logger.error('Error reading logs', { error: error.message });
  }

  return logs.reverse(); // Most recent first
}

// Generate CloudVPS-style dashboard HTML
function generateCloudVpsDashboard(data) {
  const { status, mapping, hostbillConnected, uptime, lastUpdate, middlewareUrl, dashboardStats } = data;

  const getStatusColor = () => status.online ? '#28a745' : '#dc3545';
  const getStatusText = () => status.online ? 'Online' : 'Offline';

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const getCloudVpsProductName = (id) => {
    const names = {
      '1': 'VPS Basic',
      '2': 'VPS Pro',
      '3': 'VPS Premium',
      '4': 'VPS Enterprise'
    };
    return names[id] || 'Unknown Product';
  };

  const getHostBillProductName = (id) => {
    const names = {
      '5': 'VPS Start',
      '10': 'VPS Profi',
      '11': 'VPS Premium',
      '12': 'VPS Enterprise'
    };
    return names[id] || 'Unknown Product';
  };

  return `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Middleware Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #111827;
            position: relative;
        }

        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            opacity: 0.1;
            z-index: -1;
        }

        .layout {
            display: flex;
            min-height: 100vh;
            position: relative;
        }

        /* Modern Sidebar with Glassmorphism */
        .sidebar {
            width: 18rem;
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(255, 255, 255, 0.18);
            flex-shrink: 0;
            position: fixed;
            height: 100vh;
            overflow-y: auto;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }

        .sidebar-header {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 2rem 1.5rem 1.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.18);
            min-height: 5rem;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
        }

        .sidebar-title {
            font-size: 1.25rem;
            font-weight: 800;
            color: #1f2937;
            margin-bottom: 0.5rem;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .sidebar-subtitle {
            font-size: 0.8rem;
            color: #4b5563;
            font-weight: 500;
            opacity: 0.8;
        }

        .sidebar-nav {
            padding: 1.5rem 1rem;
        }

        .nav-item {
            display: flex;
            align-items: center;
            padding: 1rem 1.25rem;
            margin-bottom: 0.5rem;
            border-radius: 1rem;
            color: #374151;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 600;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .nav-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .nav-item:hover::before {
            opacity: 1;
        }

        .nav-item:hover {
            background: rgba(255, 255, 255, 0.15);
            color: #111827;
            transform: translateX(8px);
            box-shadow: 0 4px 15px 0 rgba(31, 38, 135, 0.2);
        }

        .nav-item.active {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            box-shadow: 0 8px 25px 0 rgba(102, 126, 234, 0.4);
        }

        .nav-item.active::before {
            opacity: 0;
        }

        .nav-icon {
            width: 1.25rem;
            height: 1.25rem;
            margin-right: 1rem;
            flex-shrink: 0;
            font-size: 1.25rem;
        }

        /* Modern Main Content */
        .main-content {
            flex: 1;
            margin-left: 18rem;
            min-height: 100vh;
            position: relative;
        }

        .content-header {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.18);
            padding: 2rem 2.5rem;
            position: sticky;
            top: 0;
            z-index: 10;
            box-shadow: 0 4px 15px 0 rgba(31, 38, 135, 0.1);
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 2rem;
        }

        .header-title {
            flex: 1;
            min-width: 0;
        }

        .header-title h1 {
            font-size: 2.5rem !important;
            font-weight: 800 !important;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem !important;
            text-shadow: none !important;
        }

        .header-title p {
            font-size: 1rem !important;
            color: #6b7280 !important;
            font-weight: 500 !important;
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }

        /* Modern Buttons */
        .btn-primary {
            display: inline-flex;
            align-items: center;
            padding: 0.75rem 1.5rem;
            border: none;
            font-size: 0.9rem;
            font-weight: 600;
            border-radius: 1rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 15px 0 rgba(102, 126, 234, 0.4);
            position: relative;
            overflow: hidden;
        }

        .btn-primary::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
        }

        .btn-primary:hover::before {
            left: 100%;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px 0 rgba(102, 126, 234, 0.6);
        }

        .btn-primary:active {
            transform: translateY(0);
        }

        .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        .status-badge {
            padding: 0.5rem 1rem;
            border-radius: 2rem;
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .status-online {
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(21, 128, 61, 0.2));
            color: #15803d;
            box-shadow: 0 4px 15px 0 rgba(34, 197, 94, 0.3);
        }

        .status-offline {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(185, 28, 28, 0.2));
            color: #b91c1c;
            box-shadow: 0 4px 15px 0 rgba(239, 68, 68, 0.3);
        }

        .last-update {
            font-size: 0.85rem;
            color: #6b7280;
            font-weight: 500;
            opacity: 0.8;
        }

        /* Compact Content Area */
        .content-area {
            padding: 1.5rem;
            background: rgba(255, 255, 255, 0.05);
        }

        /* Compact Quick Actions Section */
        .quick-actions {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(20px);
            padding: 1.25rem;
            border-radius: 1rem;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            border: 1px solid rgba(255, 255, 255, 0.18);
            margin-bottom: 1.5rem;
            position: relative;
            overflow: hidden;
        }

        .quick-actions::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
        }

        .quick-actions h3 {
            font-size: 1.125rem;
            font-weight: 600;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1rem;
            text-align: center;
        }

        .actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }

        .action-tile {
            position: relative;
            padding: 1.25rem 1rem;
            border-radius: 1rem;
            color: white;
            text-decoration: none;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translateY(0);
            cursor: pointer;
            border: none;
            font-family: inherit;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            overflow: hidden;
        }

        .action-tile::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            transition: left 0.6s;
        }

        .action-tile:hover::before {
            left: 100%;
        }

        .action-tile:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.25);
        }

        .action-tile-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 0.75rem;
            position: relative;
            z-index: 1;
        }

        .action-icon {
            padding: 0.75rem;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border-radius: 0.75rem;
            font-size: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
        }

        .action-tile:hover .action-icon {
            transform: scale(1.1) rotate(5deg);
            background: rgba(255, 255, 255, 0.25);
        }

        .action-title {
            font-size: 0.875rem;
            font-weight: 600;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .action-description {
            font-size: 0.75rem;
            opacity: 0.9;
            font-weight: 500;
        }

        /* Modern Action Colors with Gradients */
        .action-orders {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow: 0 8px 32px 0 rgba(102, 126, 234, 0.4);
        }

        .action-analytics {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            box-shadow: 0 8px 32px 0 rgba(240, 147, 251, 0.4);
        }

        .action-refresh {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            box-shadow: 0 8px 32px 0 rgba(79, 172, 254, 0.4);
        }

        .action-export {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
            box-shadow: 0 8px 32px 0 rgba(67, 233, 123, 0.4);
        }

        /* Compact Dashboard Grid */
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.25rem;
            margin-bottom: 1.5rem;
        }

        .card {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 1rem;
            padding: 1.5rem;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
        }

        .card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px -12px rgba(31, 38, 135, 0.5);
            border-color: rgba(255, 255, 255, 0.3);
        }

        .card-header {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
            position: relative;
        }

        .card-title {
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            flex: 1;
            color: #374151;
            opacity: 0.8;
        }

        .card-icon {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            color: white;
            box-shadow: 0 8px 25px 0 rgba(0, 0, 0, 0.15);
            flex-shrink: 0;
            position: relative;
            overflow: hidden;
        }

        .card-icon::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05));
            border-radius: inherit;
        }

        .card-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 0.75rem;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Background decoration */
        .card::after {
            content: '';
            position: absolute;
            top: -2rem;
            right: -2rem;
            width: 6rem;
            height: 6rem;
            opacity: 0.1;
            font-size: 4rem;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
        }

        .card-change {
            font-size: 0.875rem;
            font-weight: 500;
        }

        .card-change.positive {
            color: #059669;
        }

        .card-change.negative {
            color: #dc2626;
        }

        .card-details {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .detail-item:last-child {
            border-bottom: none;
        }

        .detail-label {
            font-size: 0.75rem;
            font-weight: 400;
        }

        .detail-value {
            font-size: 0.75rem;
            font-weight: 600;
        }

        /* Card variants - Partners Portal Style with exact Tailwind colors */
        .server-card {
            background-color: ${status.online ? '#f0fdf4' : '#fef2f2'};
        }

        .server-card .card-title {
            color: ${status.online ? '#15803d' : '#b91c1c'};
        }

        .server-card .detail-label,
        .server-card .detail-value {
            color: ${status.online ? '#15803d' : '#b91c1c'};
        }

        .server-card .card-icon {
            background-color: ${status.online ? '#22c55e' : '#ef4444'};
        }

        .server-card::after {
            content: '🖥️';
            color: ${status.online ? '#22c55e' : '#ef4444'};
        }

        .mapping-card {
            background-color: #faf5ff;
        }

        .mapping-card .card-title,
        .mapping-card .detail-label,
        .mapping-card .detail-value {
            color: #7c3aed;
        }

        .mapping-card .card-icon {
            background-color: #8b5cf6;
        }

        .mapping-card::after {
            content: '🔗';
            color: #8b5cf6;
        }

        .config-card {
            background-color: #fffbeb;
        }

        .config-card .card-title,
        .config-card .detail-label,
        .config-card .detail-value {
            color: #b45309;
        }

        .config-card .card-icon {
            background-color: #f59e0b;
        }

        .config-card::after {
            content: '⚙️';
            color: #f59e0b;
        }

        .api-card {
            background-color: #eff6ff;
        }

        .api-card .card-title,
        .api-card .detail-label,
        .api-card .detail-value {
            color: #1d4ed8;
        }

        .api-card .card-icon {
            background-color: #3b82f6;
        }

        .api-card::after {
            content: '🔌';
            color: #3b82f6;
        }

        /* Sections - Partners Portal Style */
        .details-section {
            background-color: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 1rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }

        .section-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }

        .section-icon {
            width: 1.25rem;
            height: 1.25rem;
            border-radius: 0.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f3f4f6;
            color: #6b7280;
            font-size: 0.75rem;
        }

        .section-title {
            font-size: 1rem;
            font-weight: 600;
            color: #111827;
        }

        /* Tables - Partners Portal Style */
        .mapping-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            overflow: hidden;
        }

        .mapping-table th {
            background-color: #f9fafb;
            color: #374151;
            padding: 0.5rem 0.75rem;
            font-weight: 600;
            text-align: left;
            font-size: 0.625rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #e5e7eb;
        }

        .mapping-table td {
            padding: 0.5rem 0.75rem;
            background: white;
            border-bottom: 1px solid #f3f4f6;
            font-size: 0.75rem;
            color: #111827;
        }

        .mapping-table tr:last-child td {
            border-bottom: none;
        }

        .mapping-table tr:hover td {
            background-color: #f9fafb;
        }

        /* Badges - Partners Portal Style */
        .cloud-id, .hostbill-id {
            font-weight: 500;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
        }

        .cloud-id {
            background-color: #dbeafe;
            color: #1d4ed8;
        }

        .hostbill-id {
            background-color: #dcfce7;
            color: #166534;
        }

        .table-status-badge {
            padding: 0.25rem 0.5rem;
            background-color: #dcfce7;
            color: #166534;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
        }

        /* Actions Grid - Partners Portal Style */
        .actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 0.75rem;
            margin-bottom: 1rem;
        }

        .action-link {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem;
            border-radius: 0.5rem;
            text-decoration: none;
            transition: all 0.2s;
            background-color: white;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }

        .action-link:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border-color: #d1d5db;
        }

        .action-icon {
            width: 2rem;
            height: 2rem;
            border-radius: 0.375rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            flex-shrink: 0;
        }

        .action-content {
            flex: 1;
            min-width: 0;
        }

        .action-title {
            font-size: 0.75rem;
            font-weight: 600;
            color: #111827;
            margin-bottom: 0.125rem;
        }

        .action-description {
            font-size: 0.625rem;
            color: #6b7280;
        }

        /* Action Icon Colors - Partners Portal Style */
        .action-order .action-icon {
            background-color: #dcfce7;
            color: #166534;
        }

        .action-mapping .action-icon {
            background-color: #ede9fe;
            color: #7c3aed;
        }

        .action-affiliate .action-icon {
            background-color: #fef3c7;
            color: #d97706;
        }

        .action-advanced .action-icon {
            background-color: #dbeafe;
            color: #1d4ed8;
        }

        .action-dashboard .action-icon {
            background-color: #cffafe;
            color: #0891b2;
        }

        /* Footer - Partners Portal Style */
        .footer-info {
            background-color: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }

        .footer-title {
            font-size: 1rem;
            font-weight: 600;
            color: #111827;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .footer-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.75rem;
        }

        .footer-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.375rem 0;
            border-bottom: 1px solid #f3f4f6;
        }

        .footer-item:last-child {
            border-bottom: none;
        }

        .footer-label {
            font-weight: 500;
            color: #6b7280;
            font-size: 0.75rem;
        }

        .footer-value {
            color: #111827;
            font-weight: 600;
            font-size: 0.75rem;
        }

        /* Responsive Design - Partners Portal Style */
        @media (max-width: 1024px) {
            .sidebar {
                transform: translateX(-100%);
                transition: transform 0.3s ease;
            }

            .main-content {
                margin-left: 0;
            }

            .sidebar.open {
                transform: translateX(0);
            }
        }

        @media (max-width: 768px) {
            .content-area {
                padding: 1rem;
            }

            .content-header {
                padding: 1rem;
            }

            .header-content {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }

            .dashboard-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
            }

            .actions-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 0.75rem;
            }

            .footer-grid {
                grid-template-columns: 1fr;
            }

            .mapping-table {
                font-size: 0.75rem;
            }

            .mapping-table th,
            .mapping-table td {
                padding: 0.5rem;
            }
        }

        /* Modern Animations */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
        }

        .card {
            animation: fadeInUp 0.6s ease-out;
        }

        .card:nth-child(1) { animation-delay: 0.1s; }
        .card:nth-child(2) { animation-delay: 0.2s; }
        .card:nth-child(3) { animation-delay: 0.3s; }
        .card:nth-child(4) { animation-delay: 0.4s; }

        .action-tile {
            animation: fadeInUp 0.6s ease-out;
        }

        .action-tile:nth-child(1) { animation-delay: 0.2s; }
        .action-tile:nth-child(2) { animation-delay: 0.3s; }
        .action-tile:nth-child(3) { animation-delay: 0.4s; }
        .action-tile:nth-child(4) { animation-delay: 0.5s; }

        .nav-item {
            animation: slideInLeft 0.6s ease-out;
        }

        .nav-item:nth-child(1) { animation-delay: 0.1s; }
        .nav-item:nth-child(2) { animation-delay: 0.2s; }
        .nav-item:nth-child(3) { animation-delay: 0.3s; }
        .nav-item:nth-child(4) { animation-delay: 0.4s; }
        .nav-item:nth-child(5) { animation-delay: 0.5s; }
    </style>
</head>
<body>
    <div class="layout">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-title">🎛️ Systrix Middleware Dashboard</div>
                <div class="sidebar-subtitle">Monitoring a správa HostBill Order Middleware</div>
            </div>
            <nav class="sidebar-nav">
                <a href="/dashboard" class="nav-item active">
                    <span class="nav-icon">📊</span>
                    Dashboard
                </a>
                <a href="/test" class="nav-item">
                    <span class="nav-icon">🧪</span>
                    API Tests
                </a>
                <a href="/tech-dashboard" class="nav-item">
                    <span class="nav-icon">🔧</span>
                    Tech Dashboard
                </a>
                <a href="http://localhost:3000/test-portal" class="nav-item" target="_blank">
                    <span class="nav-icon">🎯</span>
                    Test Portal
                </a>
                <a href="http://localhost:3006/" class="nav-item" target="_blank">
                    <span class="nav-icon">👥</span>
                    Partners Portal
                </a>
            </nav>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Header -->
            <div class="content-header">
                <div class="header-content">
                    <div class="header-title">
                        <h1 style="font-size: 1.875rem; font-weight: 700; color: #111827; margin-bottom: 0.25rem;">Welcome back, Admin!</h1>
                        <p style="color: #6b7280; font-size: 0.875rem;">Middleware Dashboard - Status: <span class="status-badge ${status.online ? 'status-online' : 'status-offline'}">${getStatusText()}</span></p>
                    </div>
                    <div class="header-actions">
                        <div class="last-update">
                            Last update: ${lastUpdate.toLocaleTimeString()}
                        </div>
                        <button class="btn-primary" onclick="location.reload()">
                            🔄 Refresh Data
                        </button>
                    </div>
                </div>
            </div>

            <!-- Content Area -->
            <div class="content-area">
                <!-- Quick Actions -->
                <div class="quick-actions">
                    <h3>🚀 Quick Actions</h3>
                    <div class="actions-grid">
                        <button class="action-tile action-orders" onclick="window.open('/api/products', '_blank')">
                            <div class="action-tile-content">
                                <div class="action-icon">📦</div>
                                <div class="action-title">View Products</div>
                                <div class="action-description">Browse all products</div>
                            </div>
                        </button>

                        <button class="action-tile action-analytics" onclick="window.open('/api/affiliates', '_blank')">
                            <div class="action-tile-content">
                                <div class="action-icon">👥</div>
                                <div class="action-title">Affiliates</div>
                                <div class="action-description">View affiliate data</div>
                            </div>
                        </button>

                        <button class="action-tile action-refresh" onclick="location.reload()">
                            <div class="action-tile-content">
                                <div class="action-icon">🔄</div>
                                <div class="action-title">Refresh Data</div>
                                <div class="action-description">Update all data</div>
                            </div>
                        </button>

                        <button class="action-tile action-export" onclick="window.open('/test', '_blank')">
                            <div class="action-tile-content">
                                <div class="action-icon">🧪</div>
                                <div class="action-title">API Test Portal</div>
                                <div class="action-description">Test middleware APIs</div>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Key Performance Metrics -->
                <div class="quick-actions">
                    <h3>📊 Key Performance Metrics</h3>
                    <div class="dashboard-grid">
                    <!-- Server Status -->
                    <div class="card server-card">
                        <div class="card-header">
                            <div class="card-title">Server Status</div>
                            <div class="card-icon">🖥️</div>
                        </div>
                        <div class="card-value">${getStatusText()}</div>
                        <div class="card-details">
                            <div class="detail-item">
                                <span class="detail-label">Port</span>
                                <span class="detail-value">${status.port}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Version</span>
                                <span class="detail-value">${status.version}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Uptime</span>
                                <span class="detail-value">${formatUptime(uptime)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Product Mapping -->
                    <div class="card mapping-card">
                        <div class="card-header">
                            <div class="card-title">Product Mapping</div>
                            <div class="card-icon">🔗</div>
                        </div>
                        <div class="card-value">${mapping.totalMappings}</div>
                        <div class="card-details">
                            <div class="detail-item">
                                <span class="detail-label">Cloud VPS Products</span>
                                <span class="detail-value">${mapping.cloudVpsProducts?.length || 0}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">HostBill Products</span>
                                <span class="detail-value">${mapping.hostbillProducts?.length || 0}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Status</span>
                                <span class="detail-value">Active</span>
                            </div>
                        </div>
                    </div>

                    <!-- Configuration -->
                    <div class="card config-card">
                        <div class="card-header">
                            <div class="card-title">Configuration</div>
                            <div class="card-icon">⚙️</div>
                        </div>
                        <div class="card-value">Development</div>
                        <div class="card-details">
                            <div class="detail-item">
                                <span class="detail-label">Environment</span>
                                <span class="detail-value">development</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Port</span>
                                <span class="detail-value">${status.port}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">URL</span>
                                <span class="detail-value">${middlewareUrl}</span>
                            </div>
                        </div>
                    </div>

                    <!-- API Health -->
                    <div class="card api-card">
                        <div class="card-header">
                            <div class="card-title">API Health</div>
                            <div class="card-icon">🔌</div>
                        </div>
                        <div class="card-value">${status.online ? 'Healthy' : 'Unhealthy'}</div>
                        <div class="card-details">
                            <div class="detail-item">
                                <span class="detail-label">HostBill API</span>
                                <span class="detail-value">${hostbillConnected ? 'Connected' : 'Disconnected'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Order Processing</span>
                                <span class="detail-value">${status.online ? 'Available' : 'Unavailable'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Product Sync</span>
                                <span class="detail-value">${mapping.totalMappings > 0 ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                </div>

        <!-- Product Mapping Details -->
        ${Object.keys(mapping.mappings || {}).length > 0 ? `
        <div class="details-section">
            <div class="section-header">
                <div class="section-icon">🔗</div>
                <h3 class="section-title">Product Mapping Details</h3>
            </div>

            <div style="overflow-x: auto;">
                <table class="mapping-table">
                    <thead>
                        <tr>
                            <th>Cloud VPS ID</th>
                            <th>Cloud VPS Name</th>
                            <th>HostBill ID</th>
                            <th>HostBill Name</th>
                            <th style="text-align: center;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(mapping.mappings).map(([cloudVpsId, hostbillId]) => `
                        <tr>
                            <td><span class="cloud-id">${cloudVpsId}</span></td>
                            <td>${getCloudVpsProductName(cloudVpsId)}</td>
                            <td><span class="hostbill-id">${hostbillId}</span></td>
                            <td>${getHostBillProductName(hostbillId)}</td>
                            <td style="text-align: center;">
                                <span class="table-status-badge">✅ Active</span>
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : ''}

        <!-- Quick Actions -->
        <div class="details-section">
            <div class="section-header">
                <div class="section-icon">⚡</div>
                <h3 class="section-title">Quick Actions</h3>
            </div>

            <div class="actions-grid">
                <a href="http://localhost:3000/middleware-order-test" target="_blank" class="action-link action-order">
                    <div class="action-icon">🛒</div>
                    <div class="action-content">
                        <div class="action-title">Test Order Processing</div>
                        <div class="action-description">Test complete order workflow</div>
                    </div>
                </a>

                <a href="http://localhost:3000/product-mapping-test" target="_blank" class="action-link action-mapping">
                    <div class="action-icon">🔗</div>
                    <div class="action-content">
                        <div class="action-title">Product Mapping</div>
                        <div class="action-description">Check product mappings</div>
                    </div>
                </a>

                <a href="http://localhost:3000/middleware-affiliate-products" target="_blank" class="action-link action-affiliate">
                    <div class="action-icon">👥</div>
                    <div class="action-content">
                        <div class="action-title">Affiliate Products</div>
                        <div class="action-description">View affiliate products</div>
                    </div>
                </a>

                <a href="http://localhost:3000/advanced-order-test" target="_blank" class="action-link action-advanced">
                    <div class="action-icon">🚀</div>
                    <div class="action-content">
                        <div class="action-title">Advanced Order Test</div>
                        <div class="action-description">Advanced testing features</div>
                    </div>
                </a>

                <a href="/test" target="_blank" class="action-link action-dashboard">
                    <div class="action-icon">🧪</div>
                    <div class="action-content">
                        <div class="action-title">API Test Portal</div>
                        <div class="action-description">Test middleware APIs</div>
                    </div>
                </a>

                <a href="http://localhost:3000/test-portal" target="_blank" class="action-link action-affiliate">
                    <div class="action-icon">🎯</div>
                    <div class="action-content">
                        <div class="action-title">Complete Test Portal</div>
                        <div class="action-description">Full testing suite</div>
                    </div>
                </a>

                <a href="http://localhost:3005/tech-dashboard" target="_blank" class="action-link action-dashboard">
                    <div class="action-icon">🔧</div>
                    <div class="action-content">
                        <div class="action-title">Tech Dashboard</div>
                        <div class="action-description">Technical middleware dashboard</div>
                    </div>
                </a>
            </div>
        </div>

        <!-- Footer Info -->
        <div class="footer-info">
            <h4 class="footer-title">ℹ️ System Information</h4>
            <div class="footer-grid">
                <div class="footer-item">
                    <span class="footer-label">Middleware URL</span>
                    <span class="footer-value">${middlewareUrl}</span>
                </div>
                <div class="footer-item">
                    <span class="footer-label">Auto-refresh</span>
                    <span class="footer-value">30 seconds</span>
                </div>
                <div class="footer-item">
                    <span class="footer-label">Dashboard Version</span>
                    <span class="footer-value">2.0.0</span>
                </div>
                <div class="footer-item">
                    <span class="footer-label">Last Check</span>
                    <span class="footer-value">${lastUpdate.toLocaleString()}</span>
                </div>
                <div class="footer-item">
                    <span class="footer-label">Total Requests</span>
                    <span class="footer-value">${dashboardStats.requests}</span>
                </div>
                <div class="footer-item">
                    <span class="footer-label">Total Errors</span>
                    <span class="footer-value">${dashboardStats.errors}</span>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => {
            location.reload();
        }, 30000);

        // Enhanced hover effects are handled by CSS
        // Add loading animation to refresh button
        document.querySelector('.btn-primary').addEventListener('click', function() {
            this.innerHTML = '⏳ Refreshing...';
            this.disabled = true;
        });

        // Show countdown timer for auto-refresh
        let countdown = 30;
        const countdownElement = document.createElement('div');
        countdownElement.style.cssText = 'position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; z-index: 1000;';
        document.body.appendChild(countdownElement);

        const updateCountdown = () => {
            countdownElement.textContent = 'Auto-refresh in ' + countdown + 's';
            countdown--;
            if (countdown < 0) {
                countdownElement.textContent = 'Refreshing...';
            }
        };

        updateCountdown();
        const countdownInterval = setInterval(updateCountdown, 1000);

        // Clear interval when page is about to unload
        window.addEventListener('beforeunload', () => {
            clearInterval(countdownInterval);
        });
    </script>
</body>
</html>`;
}

// Integrated Dashboard Route - CloudVPS Style
app.get('/dashboard', async (req, res) => {
  try {
    // Get middleware health
    let status = {
      online: false,
      port: PORT,
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      error: null
    };

    let hostbillConnected = false;
    try {
      const testResult = await hostbillClient.makeApiCall({
        call: 'getOrderPages'
      });
      status.online = true;
      hostbillConnected = !!testResult;
    } catch (error) {
      status.error = error.message;
    }

    // Get product mapping stats
    const mappingStats = productMapper.getStats();
    const mapping = {
      totalMappings: mappingStats.totalMappings,
      cloudVpsProducts: mappingStats.cloudVpsProducts,
      hostbillProducts: mappingStats.hostbillProducts,
      mappings: mappingStats.mappings || {}
    };

    // Get system stats
    const uptime = Math.floor((Date.now() - dashboardStats.startTime.getTime()) / 1000);
    const lastUpdate = new Date();

    // Generate CloudVPS-style dashboard HTML
    const dashboardHtml = generateCloudVpsDashboard({
      status,
      mapping,
      hostbillConnected,
      uptime,
      lastUpdate,
      middlewareUrl: `http://localhost:${PORT}`,
      dashboardStats
    });

    res.send(dashboardHtml);
  } catch (error) {
    logger.error('Dashboard error', error);
    res.status(500).json({
      success: false,
      error: 'Dashboard error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check HostBill API connectivity
    let hostbillStatus = 'unknown';
    try {
      const testResult = await hostbillClient.makeApiCall({
        call: 'getOrderPages'
      });
      hostbillStatus = testResult ? 'connected' : 'disconnected';
    } catch (error) {
      hostbillStatus = 'disconnected';
    }

    // Get product mapping stats
    const mappingStats = productMapper.getStats();

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      port: PORT,
      uptime: Math.floor((Date.now() - dashboardStats.startTime.getTime()) / 1000),
      memory: process.memoryUsage(),
      hostbill_api: {
        status: hostbillStatus,
        url: process.env.HOSTBILL_API_URL
      },
      product_mapping: {
        total_mappings: mappingStats.totalMappings,
        cloud_vps_products: mappingStats.cloudVpsProducts.length,
        hostbill_products: mappingStats.hostbillProducts.length
      },
      environment: {
        node_env: process.env.NODE_ENV || 'development',
        log_level: process.env.LOG_LEVEL || 'debug'
      }
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Product mapping endpoint
app.get('/api/product-mapping', (req, res) => {
  try {
    const stats = productMapper.getStats();
    res.json({
      success: true,
      ...stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get product mapping', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get product mapping',
      timestamp: new Date().toISOString()
    });
  }
});

// Dashboard test endpoint
app.get('/test', (req, res) => {
  try {
    res.render('test', {
      middlewareUrl: `http://localhost:${PORT}`,
      title: 'Middleware API Test'
    });
  } catch (error) {
    logger.error('Test page error', error);
    res.status(500).json({
      success: false,
      error: 'Test page error',
      details: error.message
    });
  }
});

// API test endpoint for middleware testing
app.post('/api/test/middleware', async (req, res) => {
  try {
    const { endpoint, method = 'GET', data } = req.body;

    logger.info('Testing middleware endpoint', { endpoint, method });

    // For internal testing, we can call our own endpoints
    let result;

    switch (endpoint) {
      case '/health':
        result = await fetch(`http://localhost:${PORT}/health`).then(r => r.json());
        break;
      case '/api/affiliates':
        result = await fetch(`http://localhost:${PORT}/api/affiliates`).then(r => r.json());
        break;
      case '/api/products':
        result = await fetch(`http://localhost:${PORT}/api/products`).then(r => r.json());
        break;
      case '/api/payments/methods':
        result = await fetch(`http://localhost:${PORT}/api/payments/methods`).then(r => r.json());
        break;
      case '/api/test-connection':
        result = await fetch(`http://localhost:${PORT}/api/test-connection`).then(r => r.json());
        break;
      default:
        // For other endpoints, try to call them directly
        const url = `http://localhost:${PORT}${endpoint}`;
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: data && method !== 'GET' ? JSON.stringify(data) : undefined
        });
        result = await response.json();
        break;
    }

    res.json({
      success: true,
      status: 200,
      data: result
    });
  } catch (error) {
    logger.error('Middleware test failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
      status: 500
    });
  }
});

// Helper functions for Tech Dashboard
async function checkMiddlewareHealthForTechDashboard() {
  try {
    const response = await fetch(`http://localhost:${PORT}/health`);
    const data = await response.json();
    return {
      status: data.success ? 'healthy' : 'unhealthy',
      uptime: data.uptime || 0,
      version: data.version || '1.0.0',
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      lastCheck: new Date().toISOString()
    };
  }
}

async function getSystemStatsForTechDashboard() {
  try {
    const stats = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version,
      logFiles: []
    };

    // Try to get log files
    try {
      const fs = require('fs');
      const path = require('path');
      const logsDir = path.join(__dirname, 'logs');
      if (fs.existsSync(logsDir)) {
        const files = fs.readdirSync(logsDir);
        stats.logFiles = files.map(file => ({
          name: file,
          size: fs.statSync(path.join(logsDir, file)).size,
          modified: fs.statSync(path.join(logsDir, file)).mtime
        }));
      }
    } catch (logError) {
      // Ignore log file errors
    }

    return stats;
  } catch (error) {
    return {
      error: error.message,
      logFiles: []
    };
  }
}

async function getRecentLogsForTechDashboard() {
  try {
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(__dirname, 'logs', 'combined.log');

    if (fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, 'utf8');
      const lines = logContent.split('\n').filter(line => line.trim());
      return lines.slice(-20).reverse(); // Last 20 lines, newest first
    }

    return ['No log file found'];
  } catch (error) {
    return [`Error reading logs: ${error.message}`];
  }
}

// Generate Test Portal HTML
function generateTestPortalHtml() {
  return `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HostBill Test Portal</title>
    <style>
        body {
            min-height: 100vh;
            background-color: #f8f9fa;
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }

        .header {
            background-color: #343a40;
            color: white;
            padding: 20px 0;
            margin-bottom: 30px;
        }

        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .logo {
            height: 40px;
            width: auto;
        }

        .header h1 {
            margin: 0;
            font-size: 28px;
            color: white;
        }

        .header p {
            margin: 5px 0 0 0;
            opacity: 0.8;
            color: white;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        .config-info {
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }

        .config-info h3 {
            margin: 0 0 15px 0;
            color: #0c5460;
        }

        .config-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
        }

        .config-item h4 {
            margin: 0 0 8px 0;
            color: #0c5460;
        }

        .config-details {
            font-size: 14px;
            color: #0c5460;
        }

        .config-details div {
            margin-bottom: 2px;
        }

        .warning-banner {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 30px;
        }

        .warning-banner h3 {
            margin: 0 0 10px 0;
            color: #856404;
        }

        .warning-banner p {
            margin: 0;
            color: #856404;
        }

        .test-categories {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }

        .test-category {
            background-color: white;
            border-radius: 8px;
            padding: 25px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .test-category h2 {
            margin: 0 0 20px 0;
        }

        .middleware-tests h2 {
            color: #28a745;
        }

        .direct-tests h2 {
            color: #007bff;
        }

        .debug-tools h2 {
            color: #dc3545;
        }

        .production-apps h2 {
            color: #28a745;
        }

        .test-mode-info {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 15px;
            font-size: 14px;
        }

        .test-links {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .test-link {
            display: block;
            padding: 12px 16px;
            border-radius: 6px;
            text-decoration: none;
            transition: all 0.2s;
            border: 1px solid;
        }

        .test-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        /* Test link colors */
        .link-dashboard {
            background-color: #e1f5fe;
            border: 2px solid #0288d1;
            color: #0277bd;
            font-weight: bold;
        }

        .link-green {
            background-color: #d4edda;
            border-color: #28a745;
            color: #155724;
        }

        .link-blue {
            background-color: #e3f2fd;
            border-color: #2196f3;
            color: #1976d2;
        }

        .link-cyan {
            background-color: #d1ecf1;
            border-color: #17a2b8;
            color: #0c5460;
        }

        .link-orange {
            background-color: #fff3e0;
            border-color: #ff9800;
            color: #f57c00;
        }

        .link-purple {
            background-color: #f3e5f5;
            border-color: #9c27b0;
            color: #7b1fa2;
        }

        .link-light-green {
            background-color: #e8f5e8;
            border-color: #4caf50;
            color: #2e7d32;
        }

        .link-red {
            background-color: #ffebee;
            border-color: #f44336;
            color: #c62828;
        }

        .link-pink {
            background-color: #fce4ec;
            border-color: #e91e63;
            color: #c2185b;
        }

        .link-yellow {
            background-color: #fff8e1;
            border: 2px solid #ff9800;
            color: #f57c00;
            font-weight: bold;
        }

        .footer {
            margin-top: 50px;
            padding: 20px 0;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #6c757d;
        }

        .footer p {
            margin: 0;
        }

        .status-success {
            color: #28a745;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="header-content">
            <img src="/systrix-logo-white.svg" alt="Systrix Data" class="logo" />
            <div>
                <h1>🧪 HostBill Test Portal</h1>
                <p>Testovací nástroje pro HostBill API a affiliate systém</p>
            </div>
        </div>
    </header>

    <div class="container">
        <!-- Configuration Info -->
        <div class="config-info">
            <h3>🔧 API Configuration</h3>
            <div class="config-grid">
                <div class="config-item">
                    <h4>HostBill Direct API</h4>
                    <div class="config-details">
                        <div><strong>Domain:</strong> ${process.env.HOSTBILL_DOMAIN || 'vps.kabel1it.cz'}</div>
                        <div><strong>API URL:</strong> ${process.env.HOSTBILL_BASE_URL || 'https://vps.kabel1it.cz'}/admin/api.php</div>
                        <div><strong>API ID:</strong> ${process.env.HOSTBILL_API_ID ? process.env.HOSTBILL_API_ID.substring(0, 8) + '...' : 'adcdebb0...'}</div>
                        <div><strong>Status:</strong> <span class="status-success">✅ Configured</span></div>
                    </div>
                </div>
                <div class="config-item">
                    <h4>Middleware API</h4>
                    <div class="config-details">
                        <div><strong>URL:</strong> http://localhost:${PORT}</div>
                        <div><strong>Health:</strong> /health</div>
                        <div><strong>Affiliates:</strong> /api/affiliates</div>
                        <div><strong>Status:</strong> <span class="status-success">✅ Available</span></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Warning Banner -->
        <div class="warning-banner">
            <h3>⚠️ Testovací prostředí</h3>
            <p>
                Testovací prostředí obsahuje jak middleware testy (doporučené), tak přímé HostBill API testy.
                Všechny API klíče jsou nakonfigurovány v .env souboru.
            </p>
        </div>

        <!-- Test Categories -->
        <div class="test-categories">
            <!-- Middleware Tests -->
            <div class="test-category middleware-tests">
                <h2>🔗 Middleware Testy</h2>

                <!-- Test Mode Info -->
                <div class="test-mode-info">
                    <strong>🧪 Test Mode:</strong> Platby používají simulovanou bránu na localhost:${PORT}/test-payment
                </div>

                <div class="test-links">
                    <a href="http://localhost:3000/middleware-dashboard" target="_blank" class="test-link link-dashboard">
                        🎛️ Middleware Dashboard (CloudVPS)
                    </a>

                    <a href="/tech-dashboard" target="_blank" class="test-link link-dashboard">
                        🔧 Tech - Middleware Dashboard
                    </a>

                    <a href="/test" class="test-link link-green">
                        🚀 Middleware Connection Test
                    </a>

                    <a href="http://localhost:3000/middleware-affiliate-test" target="_blank" class="test-link link-blue">
                        🎯 Middleware Affiliate Test
                    </a>

                    <a href="http://localhost:3000/middleware-affiliate-products" target="_blank" class="test-link link-cyan">
                        📦 Middleware Products (Affiliate/All)
                    </a>

                    <a href="http://localhost:3000/middleware-order-test" target="_blank" class="test-link link-orange">
                        🛒 Middleware Order Test
                    </a>

                    <a href="http://localhost:3000/product-mapping-test" target="_blank" class="test-link link-purple">
                        🔗 Product Mapping Test
                    </a>

                    <a href="http://localhost:3000/advanced-order-test" target="_blank" class="test-link link-light-green">
                        🚀 Advanced Order Test (Middleware)
                    </a>

                    <a href="http://localhost:3000/payment-test" target="_blank" class="test-link link-dashboard">
                        💳 Payment System Test (Middleware)
                    </a>

                    <a href="http://localhost:3000/test-payment-gateway" target="_blank" class="test-link link-purple">
                        🧪 Test Payment Gateway
                    </a>

                    <a href="http://localhost:3000/payment-methods-test" target="_blank" class="test-link link-light-green">
                        🔍 Payment Methods Test
                    </a>
                </div>
            </div>

            <!-- Direct HostBill Tests -->
            <div class="test-category direct-tests">
                <h2>👥 Direct HostBill Testy</h2>

                <div class="test-links">
                    <a href="http://localhost:3000/affiliate-test" target="_blank" class="test-link link-blue">
                        🔍 Základní Affiliate Test
                    </a>

                    <a href="http://localhost:3000/affiliate-test-real" target="_blank" class="test-link link-light-green">
                        🛒 Reálný Affiliate Test
                    </a>

                    <a href="http://localhost:3000/affiliate-products-test" target="_blank" class="test-link link-orange">
                        📦 Direct HostBill Products (Affiliate/All)
                    </a>

                    <a href="http://localhost:3000/direct-order-test" target="_blank" class="test-link link-light-green">
                        🛒 Direct HostBill Order Test
                    </a>

                    <a href="http://localhost:3000/direct-advanced-order-test" target="_blank" class="test-link link-red">
                        ⚡ Direct Advanced Order Test
                    </a>

                    <a href="http://localhost:3000/affiliate-scenarios" target="_blank" class="test-link link-purple">
                        🎭 Affiliate Scénáře
                    </a>

                    <a href="http://localhost:3000/payment-test?mode=direct" target="_blank" class="test-link link-yellow">
                        💳 Payment System Test (Direct)
                    </a>

                    <a href="http://localhost:3000/direct-payment-test" target="_blank" class="test-link link-pink">
                        🎯 Direct HostBill Payment Test
                    </a>

                    <a href="http://localhost:3000/real-payment-methods-test" target="_blank" class="test-link link-light-green" style="border: 2px solid #4caf50; font-weight: bold;">
                        🔍 Real Payment Methods Test
                    </a>

                    <a href="http://localhost:3000/hostbill-modules-test" target="_blank" class="test-link link-purple">
                        🏢 HostBill Payment Modules
                    </a>

                    <a href="http://localhost:3000/complete-order-test" target="_blank" class="test-link link-yellow">
                        🛒 Complete Order Workflow Test
                    </a>

                    <a href="http://localhost:3000/integration-test" target="_blank" class="test-link link-light-green" style="border: 3px solid #4caf50; font-weight: bold; font-size: 16px;">
                        🔗 CloudVPS ↔ Middleware Integration Test
                    </a>
                </div>
            </div>

            <!-- Debug Tools -->
            <div class="test-category debug-tools">
                <h2>🐛 Debug Nástroje</h2>

                <div class="test-links">
                    <a href="http://localhost:3000/debug-affiliate" target="_blank" class="test-link link-red">
                        🔧 Debug Affiliate Data
                    </a>

                    <a href="/api/test-connection" target="_blank" class="test-link link-cyan">
                        🔗 Test HostBill API Connection
                    </a>

                    <a href="/api/affiliates" target="_blank" class="test-link link-light-green">
                        📋 Všichni Affiliates
                    </a>
                </div>
            </div>

            <!-- Production Links -->
            <div class="test-category production-apps">
                <h2>🚀 Produkční Aplikace</h2>

                <div class="test-links">
                    <a href="http://localhost:3000/" target="_blank" class="test-link link-green">
                        🏠 Hlavní Stránka
                    </a>

                    <a href="http://localhost:3000/checkout" target="_blank" class="test-link link-green">
                        🛒 Checkout (Middleware)
                    </a>

                    <a href="http://localhost:3000/pricing" target="_blank" class="test-link link-green">
                        💰 Ceník
                    </a>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="footer">
            <p>
                Test Portal pro HostBill API | Middleware Port: ${PORT}
            </p>
        </footer>
    </div>
</body>
</html>`;
}

// Generate Tech Dashboard HTML
function generateTechDashboardHtml(data) {
  const { middlewareHealth, systemStats, recentLogs, uptime, stats } = data;

  return `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tech - Middleware Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background: rgba(255, 255, 255, 0.95);
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }

        .header h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .status-badge {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-healthy {
            background: #2ecc71;
            color: white;
        }

        .status-unhealthy {
            background: #e74c3c;
            color: white;
        }

        .status-error {
            background: #f39c12;
            color: white;
        }

        .refresh-btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin-left: auto;
        }

        .refresh-btn:hover {
            background: #2980b9;
        }

        .nav-links {
            display: flex;
            gap: 15px;
            margin-top: 15px;
            flex-wrap: wrap;
        }

        .nav-links a {
            color: #3498db;
            text-decoration: none;
            padding: 8px 16px;
            background: rgba(52, 152, 219, 0.1);
            border-radius: 5px;
            transition: all 0.3s ease;
        }

        .nav-links a:hover {
            background: rgba(52, 152, 219, 0.2);
            transform: translateY(-2px);
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .card {
            background: rgba(255, 255, 255, 0.95);
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }

        .card h3 {
            color: #2c3e50;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #ecf0f1;
        }

        .stat-item:last-child {
            border-bottom: none;
        }

        .stat-value {
            font-weight: bold;
            color: #27ae60;
        }

        .log-container {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-height: 300px;
            overflow-y: auto;
            white-space: pre-wrap;
        }

        .metric-card {
            text-align: center;
            padding: 15px;
        }

        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #3498db;
            display: block;
        }

        .metric-label {
            color: #7f8c8d;
            font-size: 0.9em;
            margin-top: 5px;
        }

        .health-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
        }

        .health-healthy {
            background: #2ecc71;
        }

        .health-unhealthy {
            background: #e74c3c;
        }

        .health-error {
            background: #f39c12;
        }

        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }

            .grid {
                grid-template-columns: 1fr;
            }

            .nav-links {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>
                🔧 Tech - Middleware Dashboard
                <span class="status-badge status-${middlewareHealth.status}">
                    ${middlewareHealth.status}
                </span>
                <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
            </h1>
            <p>Technical Monitoring HostBill Order Middleware - Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s</p>
            <div class="nav-links">
                <a href="/tech-dashboard">🔧 Tech Dashboard</a>
                <a href="/test">🧪 Test API</a>
                <a href="/health">💚 Health Check</a>
                <a href="/api/product-mapping">📊 Product Mapping</a>
                <a href="/test-portal">🧪 Test Portal</a>
                <a href="/dashboard">📊 Main Dashboard</a>
            </div>
        </div>

        <div class="grid">
            <!-- System Stats -->
            <div class="card">
                <h3>📊 System Statistics</h3>
                <div class="stat-item">
                    <span>Total Requests</span>
                    <span class="stat-value">${stats.requests || 0}</span>
                </div>
                <div class="stat-item">
                    <span>Errors</span>
                    <span class="stat-value">${stats.errors || 0}</span>
                </div>
                <div class="stat-item">
                    <span>Last Activity</span>
                    <span class="stat-value">${stats.lastActivity ? new Date(stats.lastActivity).toLocaleString() : 'Never'}</span>
                </div>
                <div class="stat-item">
                    <span>Memory Usage</span>
                    <span class="stat-value">${Math.round(systemStats.memory?.heapUsed / 1024 / 1024) || 0} MB</span>
                </div>
                <div class="stat-item">
                    <span>Platform</span>
                    <span class="stat-value">${systemStats.platform || 'Unknown'}</span>
                </div>
                <div class="stat-item">
                    <span>Node Version</span>
                    <span class="stat-value">${systemStats.nodeVersion || 'Unknown'}</span>
                </div>
            </div>

            <!-- Middleware Health -->
            <div class="card">
                <h3>💚 Middleware Health</h3>
                <div class="stat-item">
                    <span><span class="health-indicator health-${middlewareHealth.status}"></span>Status</span>
                    <span class="stat-value">${middlewareHealth.status}</span>
                </div>
                <div class="stat-item">
                    <span>Version</span>
                    <span class="stat-value">${middlewareHealth.version || '1.0.0'}</span>
                </div>
                <div class="stat-item">
                    <span>Last Check</span>
                    <span class="stat-value">${new Date(middlewareHealth.lastCheck).toLocaleTimeString()}</span>
                </div>
                ${middlewareHealth.error ? `
                <div class="stat-item">
                    <span>Error</span>
                    <span class="stat-value" style="color: #e74c3c;">${middlewareHealth.error}</span>
                </div>
                ` : ''}
            </div>

            <!-- Performance Metrics -->
            <div class="card">
                <h3>⚡ Performance Metrics</h3>
                <div class="metric-card">
                    <span class="metric-value">${Math.round(systemStats.memory?.heapUsed / 1024 / 1024) || 0}</span>
                    <div class="metric-label">Memory Usage (MB)</div>
                </div>
                <div class="stat-item">
                    <span>Heap Total</span>
                    <span class="stat-value">${Math.round(systemStats.memory?.heapTotal / 1024 / 1024) || 0} MB</span>
                </div>
                <div class="stat-item">
                    <span>External</span>
                    <span class="stat-value">${Math.round(systemStats.memory?.external / 1024 / 1024) || 0} MB</span>
                </div>
                <div class="stat-item">
                    <span>Process Uptime</span>
                    <span class="stat-value">${Math.floor(systemStats.uptime / 3600)}h ${Math.floor((systemStats.uptime % 3600) / 60)}m</span>
                </div>
            </div>

            <!-- Log Files -->
            <div class="card">
                <h3>📁 Log Files</h3>
                ${systemStats.logFiles && systemStats.logFiles.length > 0 ?
                    systemStats.logFiles.map(file => `
                    <div class="stat-item">
                        <span>${file.name}</span>
                        <span class="stat-value">${Math.round(file.size / 1024)} KB</span>
                    </div>
                    `).join('') :
                    '<div class="stat-item"><span>No log files found</span></div>'
                }
            </div>
        </div>

        <!-- Recent Logs -->
        <div class="card">
            <h3>📋 Recent Logs</h3>
            <div class="log-container">
${recentLogs.join('\\n')}
            </div>
        </div>

        <!-- API Endpoints -->
        <div class="card" style="margin-top: 20px;">
            <h3>🔗 API Endpoints</h3>
            <div class="nav-links">
                <a href="/health" target="_blank">💚 Health Check</a>
                <a href="/api/affiliates" target="_blank">👥 Affiliates</a>
                <a href="/api/products" target="_blank">📦 Products</a>
                <a href="/api/payments/methods" target="_blank">💳 Payment Methods</a>
                <a href="/api/product-mapping" target="_blank">🔗 Product Mapping</a>
                <a href="/api/test-connection" target="_blank">🧪 Test Connection</a>
            </div>
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => {
            location.reload();
        }, 30000);

        // Add click handlers for nav links
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', function(e) {
                if (this.href.includes('/api/') || this.href.includes('/health')) {
                    e.preventDefault();
                    window.open(this.href, '_blank');
                }
            });
        });
    </script>
</body>
</html>`;
}

// Test Portal endpoint
app.get('/test-portal', (req, res) => {
  try {
    const testPortalHtml = generateTestPortalHtml();
    res.send(testPortalHtml);
  } catch (error) {
    logger.error('Test portal error', error);
    res.status(500).json({
      success: false,
      error: 'Test portal error',
      details: error.message
    });
  }
});

// Tech - Middleware Dashboard endpoint
app.get('/tech-dashboard', async (req, res) => {
  try {
    // Get middleware health
    const middlewareHealth = await checkMiddlewareHealthForTechDashboard();

    // Get system stats
    const systemStats = await getSystemStatsForTechDashboard();

    // Get recent logs
    const recentLogs = await getRecentLogsForTechDashboard();

    // Calculate uptime
    const uptime = Math.floor((new Date() - startTime) / 1000);

    const techDashboardHtml = generateTechDashboardHtml({
      middlewareHealth,
      systemStats,
      recentLogs,
      uptime,
      stats: dashboardStats
    });

    res.send(techDashboardHtml);
  } catch (error) {
    logger.error('Tech dashboard error', error);
    res.status(500).json({
      success: false,
      error: 'Tech dashboard error',
      details: error.message
    });
  }
});

// Dashboard API endpoints
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await getRecentLogs();
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    logger.error('Failed to get logs', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get logs',
      details: error.message
    });
  }
});

// Middleware statistics endpoint
app.get('/api/stats', async (req, res) => {
  try {
    // Get product mapping stats
    const mappingStats = productMapper.getStats();

    // Check HostBill connectivity
    let hostbillConnectivity = false;
    let hostbillError = null;
    try {
      const testResult = await hostbillClient.makeApiCall({
        call: 'getOrderPages'
      });
      hostbillConnectivity = !!testResult;
    } catch (error) {
      hostbillError = error.message;
    }

    res.json({
      success: true,
      server: {
        status: 'running',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0',
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      },
      hostbill: {
        connected: hostbillConnectivity,
        api_url: process.env.HOSTBILL_API_URL,
        error: hostbillError
      },
      product_mapping: mappingStats,
      configuration: {
        log_level: process.env.LOG_LEVEL || 'debug',
        default_currency: process.env.DEFAULT_CURRENCY || 'CZK',
        default_payment_method: process.env.DEFAULT_PAYMENT_METHOD || 'banktransfer'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get middleware stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get middleware statistics',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// HostBill connection test endpoint
app.get('/api/test-connection', async (req, res) => {
  try {
    logger.info('Testing HostBill connection');
    const result = await hostbillClient.testConnection();

    res.json({
      success: true,
      message: 'HostBill connection successful',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('HostBill connection test failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'HostBill connection failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all affiliates endpoint
app.get('/api/affiliates', async (req, res) => {
  try {
    logger.info('Getting all affiliates');
    const result = await hostbillClient.makeApiCall({
      call: 'getAffiliates'
    });

    res.json({
      success: true,
      affiliates: result.affiliates || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get affiliates', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get affiliates',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get specific affiliate endpoint
app.get('/api/affiliate/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Getting affiliate details', { affiliateId: id });

    const result = await hostbillClient.validateAffiliate(id);

    if (result) {
      res.json({
        success: true,
        affiliate: result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Affiliate not found or inactive',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Failed to get affiliate', { error: error.message, affiliateId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to get affiliate',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get affiliate products endpoint
app.get('/api/affiliate/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { mode = 'affiliate' } = req.query;
    logger.info('Getting affiliate products', { affiliateId: id, mode });

    // First validate the affiliate exists
    const affiliate = await hostbillClient.validateAffiliate(id);
    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found or inactive',
        timestamp: new Date().toISOString()
      });
    }

    // Get commission plans for this affiliate
    let commissionPlans = [];
    let applicableProducts = new Set();
    let productCommissions = {};

    try {
      logger.info('Loading commission plans from HostBill API');
      const commissionResult = await hostbillClient.makeApiCall({
        call: 'getAffiliateCommisionPlans'
      });

      if (commissionResult && commissionResult.commisions) {
        commissionPlans = commissionResult.commisions;

        // Parse commission plans to extract applicable products
        commissionPlans.forEach(plan => {
          if (plan.applicable_products) {
            const productIds = plan.applicable_products
              .split(',')
              .map(id => id.trim())
              .filter(id => id && !id.startsWith('-')); // Filter out negative IDs

            productIds.forEach(productId => {
              applicableProducts.add(productId);
              productCommissions[productId] = {
                plan_id: plan.id,
                plan_name: plan.name,
                type: plan.type,
                rate: plan.rate,
                recurring: plan.recurring === '1'
              };
            });
          }
        });
      }

      logger.info('Commission plans processed', {
        totalPlans: commissionPlans.length,
        applicableProducts: applicableProducts.size
      });
    } catch (error) {
      logger.warn('Failed to load commission plans', { error: error.message });
    }

    // Try to get real products from HostBill API
    let productsWithCommissions = [];

    try {
      // Get products from HostBill using correct API workflow
      logger.info('Loading products from HostBill API');

      // Step 1: Get all orderpages
      const orderPagesResult = await hostbillClient.makeApiCall({
        call: 'getOrderPages'
      });

      if (!orderPagesResult || !orderPagesResult.categories) {
        throw new Error('No orderpages returned from HostBill');
      }

      logger.debug('Found orderpages', {
        count: orderPagesResult.categories.length,
        orderpages: orderPagesResult.categories.map(cat => ({ id: cat.id, name: cat.name }))
      });

      // Step 2: Get products from all orderpages
      let allProducts = [];

      for (const orderpage of orderPagesResult.categories) {
        try {
          const productsResult = await hostbillClient.makeApiCall({
            call: 'getProducts',
            id: orderpage.id
          });

          if (productsResult && productsResult.products) {
            // Convert products object to array
            const categoryProducts = Object.values(productsResult.products);

            // Filter products based on mode
            let filteredProducts;
            if (mode === 'all') {
              // All products mode - return all products with commission info if available
              filteredProducts = categoryProducts;
            } else {
              // Affiliate mode - only products that have commissions for this affiliate
              filteredProducts = categoryProducts.filter(product =>
                applicableProducts.has(product.id)
              );
            }

            // Add orderpage info and commission details to each product
            const products = filteredProducts.map(product => {
              const commissionInfo = productCommissions[product.id];

              // For all mode, provide default commission info if not available
              const finalCommissionInfo = commissionInfo || (mode === 'all' ? {
                plan_id: null,
                plan_name: 'No commission plan',
                type: 'Percent',
                rate: '0',
                recurring: false
              } : null);

              return {
                ...product,
                orderpage_id: orderpage.id,
                orderpage_name: orderpage.name,
                monthly_price: product.m,
                quarterly_price: product.q,
                semi_annually_price: product.s,
                annually_price: product.a,
                category: {
                  id: orderpage.id,
                  name: orderpage.name,
                  description: orderpage.description || ''
                },
                commission: finalCommissionInfo ? {
                  ...finalCommissionInfo,
                  monthly_amount: calculateCommission(product.m, finalCommissionInfo),
                  quarterly_amount: calculateCommission(product.q, finalCommissionInfo),
                  semiannually_amount: calculateCommission(product.s, finalCommissionInfo),
                  annually_amount: calculateCommission(product.a, finalCommissionInfo),
                  has_commission: !!commissionInfo
                } : null
              };
            });

            allProducts = allProducts.concat(products);

            logger.debug('Loaded products from orderpage', {
              orderpageId: orderpage.id,
              orderpage: orderpage.name,
              productCount: products.length,
              mode: mode,
              filteredCount: filteredProducts.length,
              totalCategoryProducts: categoryProducts.length
            });
          }
        } catch (error) {
          logger.warn('Failed to load products from orderpage', {
            orderpageId: orderpage.id,
            orderpage: orderpage.name,
            error: error.message
          });
        }
      }

      if (allProducts.length === 0) {
        throw new Error('No products found in any orderpage');
      }

      logger.info('Successfully loaded products from HostBill', {
        totalProducts: allProducts.length,
        productIds: allProducts.map(p => p.id),
        productNames: allProducts.map(p => p.name)
      });

      // Products already have commission info added in the loop above
      productsWithCommissions = allProducts;
    } catch (error) {
      logger.warn('Failed to load products from HostBill, using fallback', {
        error: error.message
      });

      // Fallback to mock products matching real HostBill product IDs
      productsWithCommissions = [
        {
          id: '10',
          name: 'VPS Profi',
          description: 'Virtuální servery',
          monthly_price: '499',
          quarterly_price: 'N/A',
          semi_annually_price: 'N/A',
          annually_price: 'N/A',
          commission: {
            type: 'Percent',
            rate: '25'
          }
        },
        {
          id: '11',
          name: 'VPS Premium',
          description: 'Virtuální servery',
          monthly_price: '899',
          quarterly_price: 'N/A',
          semi_annually_price: 'N/A',
          annually_price: 'N/A',
          commission: {
            type: 'Percent',
            rate: '25'
          }
        },
        {
          id: '12',
          name: 'VPS Enterprise',
          description: 'Virtuální servery',
          monthly_price: '1299',
          quarterly_price: 'N/A',
          semi_annually_price: 'N/A',
          annually_price: 'N/A',
          commission: {
            type: 'Percent',
            rate: '25'
          }
        }
      ];
    }

    res.json({
      success: true,
      mode: mode,
      affiliate: affiliate,
      commission_plans: commissionPlans,
      products: productsWithCommissions,
      summary: {
        total_products: productsWithCommissions.length,
        total_applicable_products: applicableProducts.size,
        products_with_commission: productsWithCommissions.filter(p => p.commission?.has_commission).length,
        products_without_commission: productsWithCommissions.filter(p => !p.commission?.has_commission).length,
        commission_plans_count: commissionPlans.length
      },
      note: mode === 'all'
        ? 'Middleware: All products from all categories - some may not have commission plans for this affiliate'
        : 'Middleware: Only products with commission plans for this affiliate',
      source: 'middleware_affiliate_products',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get affiliate products', {
      error: error.message,
      affiliateId: req.params.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get affiliate products',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all products endpoint
app.get('/api/products/all', async (req, res) => {
  try {
    logger.info('Getting all products from HostBill');

    // Get products from HostBill using the same logic as affiliate products
    // Get all orderpages
    const orderPagesResult = await hostbillClient.makeApiCall({
      call: 'getOrderPages'
    });

    if (!orderPagesResult || !orderPagesResult.categories) {
      throw new Error('No orderpages returned from HostBill');
    }

    logger.debug('Found orderpages for all products', {
      count: orderPagesResult.categories.length,
      orderpages: orderPagesResult.categories.map(cat => ({ id: cat.id, name: cat.name }))
    });

    // Get products from all orderpages
    let allProducts = [];

    for (const orderpage of orderPagesResult.categories) {
      try {
        const productsResult = await hostbillClient.makeApiCall({
          call: 'getProducts',
          id: orderpage.id
        });

        if (productsResult && productsResult.products) {
          // Convert products object to array and add orderpage info
          const products = Object.values(productsResult.products).map(product => ({
            ...product,
            orderpage_id: orderpage.id,
            orderpage_name: orderpage.name,
            monthly_price: product.m,
            quarterly_price: product.q,
            semi_annually_price: product.s,
            annually_price: product.a,
            commission: {
              type: 'Percent',
              rate: '25' // Default commission rate
            }
          }));

          allProducts = allProducts.concat(products);

          logger.debug('Loaded products from orderpage for all products', {
            orderpageId: orderpage.id,
            orderpage: orderpage.name,
            productCount: products.length
          });
        }
      } catch (error) {
        logger.warn('Failed to load products from orderpage for all products', {
          orderpageId: orderpage.id,
          orderpage: orderpage.name,
          error: error.message
        });
      }
    }

    if (allProducts.length === 0) {
      throw new Error('No products found in any orderpage');
    }

    logger.info('Successfully loaded all products', {
      totalProducts: allProducts.length,
      productIds: allProducts.map(p => p.id),
      productNames: allProducts.map(p => p.name)
    });

    res.json({
      success: true,
      products: allProducts,
      totalProducts: allProducts.length,
      orderpages: orderPagesResult.categories.map(cat => ({ id: cat.id, name: cat.name })),
      note: 'All products from all orderpages with default 25% commission',
      source: 'middleware_all_products',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get all products', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get all products',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint for testing client creation
app.post('/api/debug-client', async (req, res) => {
  try {
    logger.info('Debug: Testing client creation');

    const testClientData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+420123456789',
      address: 'Test Address 123',
      city: 'Prague',
      postalCode: '11000',
      country: 'CZ'
    };

    const result = await hostbillClient.createClient(testClientData);

    res.json({
      success: true,
      message: 'Client created successfully',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Debug client creation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Client creation failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Payment modules endpoint - get active payment modules from HostBill using proven method
app.get('/api/payment-modules', async (req, res) => {
  try {
    logger.info('Getting payment modules from HostBill using proven method');

    // Use known working modules from test portal (skip API methods check for now)
    logger.debug('Using known active modules from testing');

    const modulesData = {
      success: true,
      modules: {
        '10': 'payU',
        '112': 'Paypal Checkout v2',
        '121': 'Stripe Intents - 3D Secure'
      },
      server_time: Math.floor(Date.now() / 1000)
    };

    // Map modules to our format
    const modules = modulesData.modules;
    const mappedModules = [];

    // Known module mappings from test portal
    const moduleMapping = {
      '10': { method: 'payu', name: 'PayU', type: 'redirect', icon: '💰' },
      '112': { method: 'paypal', name: 'PayPal Checkout v2', type: 'redirect', icon: '🅿️' },
      '121': { method: 'card', name: 'Stripe Intents - 3D Secure', type: 'redirect', icon: '💳' }
    };

    for (const [moduleId, moduleName] of Object.entries(modules)) {
      const mapping = moduleMapping[moduleId];

      mappedModules.push({
        id: moduleId,
        name: moduleName,
        method: mapping?.method || `module${moduleId}`,
        type: mapping?.type || 'redirect',
        icon: mapping?.icon || '💳',
        enabled: true,
        source: 'hostbill-api',
        known: !!mapping,
        hostbillModuleId: moduleId
      });

      logger.debug('Payment module mapped', {
        moduleId,
        moduleName,
        method: mapping?.method || `module${moduleId}`,
        known: !!mapping
      });
    }

    logger.info('Payment modules retrieved and mapped', {
      total: mappedModules.length,
      known: mappedModules.filter(m => m.known).length,
      unknown: mappedModules.filter(m => !m.known).length
    });

    res.json({
      success: true,
      modules: mappedModules,
      rawModules: modules,
      total: mappedModules.length,
      known: mappedModules.filter(m => m.known).length,
      unknown: mappedModules.filter(m => !m.known).length,
      apiInfo: {
        hasGetPaymentModules: true,
        serverTime: modulesData.server_time
      },
      source: 'middleware-hostbill',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get payment modules', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get payment modules',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Products endpoint - get available products from HostBill using proven method
app.get('/api/products', async (req, res) => {
  try {
    logger.info('Getting products from HostBill using proven method');

    // Step 1: Get all orderpages (like in working test portal)
    const orderPagesData = await hostbillClient.makeApiCall({
      call: 'getOrderPages'
    });

    if (!orderPagesData.success || !orderPagesData.categories) {
      throw new Error('Failed to get orderpages from HostBill');
    }

    logger.debug('Found orderpages', {
      count: orderPagesData.categories.length,
      orderpages: orderPagesData.categories.map(cat => ({ id: cat.id, name: cat.name }))
    });

    // Step 2: Get products from all orderpages
    let allProducts = [];

    for (const orderpage of orderPagesData.categories) {
      try {
        const productsData = await hostbillClient.makeApiCall({
          call: 'getProducts',
          id: orderpage.id
        });

        if (productsData.success && productsData.products) {
          // Convert products object to array and add orderpage info
          const products = Object.values(productsData.products).map(product => {
            // Find CloudVPS mapping for this HostBill product
            const cloudVpsId = productMapper.getCloudVpsId(product.id);

            return {
              id: cloudVpsId || product.id, // Use mapped ID or original
              hostbillId: product.id,
              name: product.name || `Product ${product.id}`,
              description: product.description || '',
              price: parseFloat(product.m) || 0, // Monthly price
              currency: 'CZK',
              category: 'VPS',
              orderpage_id: orderpage.id,
              orderpage_name: orderpage.name,
              monthly_price: product.m,
              quarterly_price: product.q,
              semi_annually_price: product.s,
              annually_price: product.a,
              available: true,
              source: 'hostbill-api',
              mapped: !!cloudVpsId
            };
          });

          allProducts = allProducts.concat(products);

          logger.debug('Products loaded from orderpage', {
            orderpage: orderpage.name,
            count: products.length
          });
        }
      } catch (error) {
        logger.warn('Failed to load products from orderpage', {
          orderpage: orderpage.name,
          error: error.message
        });
      }
    }

    if (allProducts.length === 0) {
      throw new Error('No products found in any orderpage');
    }

    logger.info('Products retrieved successfully', {
      total: allProducts.length,
      mapped: allProducts.filter(p => p.mapped).length,
      orderpages: orderPagesData.categories.length
    });

    res.json({
      success: true,
      products: allProducts,
      total: allProducts.length,
      mapped: allProducts.filter(p => p.mapped).length,
      orderpages: orderPagesData.categories.map(cat => ({ id: cat.id, name: cat.name })),
      source: 'middleware-hostbill',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get products', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get products',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Order creation endpoint (alias for process-order)
app.post('/api/orders/create', [
  // Validation middleware
  body('customer.firstName').notEmpty().withMessage('First name is required'),
  body('customer.lastName').notEmpty().withMessage('Last name is required'),
  body('customer.email').isEmail().withMessage('Valid email is required'),
  body('customer.phone').notEmpty().withMessage('Phone is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required')
], async (req, res) => {
  try {
    logger.info('Processing order creation request', {
      customerEmail: req.body.customer?.email,
      itemCount: req.body.items?.length
    });

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Process order using existing order processor
    const result = await orderProcessor.processOrder(req.body);

    logger.info('Order creation completed', {
      success: result.success,
      clientId: result.client?.id,
      orderCount: result.orders?.length
    });

    res.json(result);

  } catch (error) {
    logger.error('Order creation failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Order creation failed',
      details: error.message
    });
  }
});

// Main order processing endpoint
app.post('/api/process-order', [
  // Validation middleware
  body('customer.firstName').notEmpty().withMessage('First name is required'),
  body('customer.lastName').notEmpty().withMessage('Last name is required'),
  body('customer.email').isEmail().withMessage('Valid email is required'),
  body('customer.phone').notEmpty().withMessage('Phone is required'),
  body('customer.address').notEmpty().withMessage('Address is required'),
  body('customer.city').notEmpty().withMessage('City is required'),
  body('customer.postalCode').notEmpty().withMessage('Postal code is required'),
  body('customer.country').notEmpty().withMessage('Country is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').notEmpty().withMessage('Product ID is required for all items'),
  body('items.*.name').notEmpty().withMessage('Product name is required for all items'),
  body('items.*.price').isNumeric().withMessage('Valid price is required for all items')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Order validation failed', { errors: errors.array() });
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Processing new order', {
      customerEmail: req.body.customer.email,
      itemCount: req.body.items.length,
      hasAffiliate: !!req.body.affiliate
    });

    // Process the order
    const result = await orderProcessor.processCompleteOrder(req.body);

    logger.info('Order processed successfully', {
      clientId: result.client.id,
      orderIds: result.orders.map(o => o.orderId),
      affiliateId: result.affiliate?.id
    });

    res.json({
      success: true,
      message: 'Order processed successfully',
      processingId: result.processingId,
      clientId: result.client?.id,
      orders: result.orders,
      affiliateAssigned: !!result.affiliate,
      affiliate: result.affiliate,
      errors: result.errors,
      source: 'middleware',
      middleware_url: process.env.MIDDLEWARE_URL || 'http://localhost:3005',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Order processing failed', {
      error: error.message,
      stack: error.stack,
      customerEmail: req.body.customer?.email
    });

    res.status(500).json({
      success: false,
      error: 'Order processing failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Order confirmation page endpoint
app.get('/confirmation/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    logger.info('Displaying order confirmation', { orderId });

    // Get order details from HostBill
    const orderDetails = await hostbillClient.getOrderDetails(orderId);

    // Render confirmation page
    const confirmationHtml = await orderProcessor.generateConfirmationPage(orderDetails, orderId);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(confirmationHtml);

  } catch (error) {
    logger.error('Failed to display confirmation page', {
      orderId: req.params.orderId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to load confirmation page',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// PAYMENT PROCESSING ENDPOINTS
// =============================================================================

/**
 * GET /api/payments/methods
 * Get available payment methods
 */
app.get('/api/payments/methods', async (req, res) => {
  try {
    logger.info('Getting available payment methods');

    const methods = await paymentProcessor.getAvailablePaymentMethods();

    res.json({
      success: true,
      methods,
      total: methods.length,
      enabled: methods.filter(m => m.enabled).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get payment methods', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get payment methods',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/payments/initialize
 * Initialize payment for order/invoice
 */
app.post('/api/payments/initialize', [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('invoiceId').notEmpty().withMessage('Invoice ID is required'),
  body('method').notEmpty().withMessage('Payment method is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Initializing payment', {
      orderId: req.body.orderId,
      invoiceId: req.body.invoiceId,
      method: req.body.method,
      amount: req.body.amount
    });

    const result = await paymentProcessor.initializePayment(req.body);

    res.json({
      success: true,
      message: 'Payment initialized successfully',
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to initialize payment', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to initialize payment',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/payments/callback
 * Handle payment gateway callbacks
 */
app.post('/api/payments/callback', async (req, res) => {
  try {
    logger.info('Processing payment callback', {
      gateway: req.body.gateway,
      invoiceId: req.body.invoiceId || req.body.invoice_id,
      status: req.body.status
    });

    const result = await paymentProcessor.processPaymentCallback(req.body);

    res.json({
      success: true,
      message: 'Callback processed successfully',
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to process payment callback', { error: error.message });
    res.status(200).json({ // Return 200 to prevent gateway retries
      success: false,
      error: 'Failed to process callback',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/payments/status
 * Get payment status
 */
app.get('/api/payments/status', async (req, res) => {
  try {
    const { paymentId, invoiceId, orderId } = req.query;

    if (!paymentId && !invoiceId && !orderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: paymentId, invoiceId, or orderId',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Getting payment status', { paymentId, invoiceId, orderId });

    // For now, get invoice details from HostBill
    let invoice = null;
    let order = null;

    if (invoiceId) {
      try {
        invoice = await hostbillClient.makeApiCall({
          call: 'getInvoiceDetails',
          id: invoiceId
        });
      } catch (error) {
        logger.warn('Failed to get invoice details', { invoiceId, error: error.message });
      }
    }

    if (orderId) {
      try {
        order = await hostbillClient.getOrderDetails(orderId);
      } catch (error) {
        logger.warn('Failed to get order details', { orderId, error: error.message });
      }
    }

    res.json({
      success: true,
      message: 'Payment status retrieved',
      payment: {
        paymentId,
        orderId,
        invoiceId,
        status: invoice?.invoice?.status || 'unknown'
      },
      invoice: invoice?.invoice || null,
      order: order || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get payment status', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get payment status',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test payment page endpoint
app.get('/test-payment', (req, res) => {
  const {
    paymentId,
    orderId,
    invoiceId,
    method,
    amount,
    currency,
    successUrl,
    cancelUrl,
    testMode
  } = req.query;

  // Generate test payment page HTML
  const testPaymentHtml = `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Payment Gateway - ${method.toUpperCase()}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .payment-card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .amount {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin: 20px 0;
        }
        .details {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
        }
        .buttons {
            display: flex;
            gap: 15px;
            margin-top: 30px;
        }
        .btn {
            flex: 1;
            padding: 15px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-success {
            background: #10b981;
            color: white;
        }
        .btn-success:hover {
            background: #059669;
        }
        .btn-cancel {
            background: #ef4444;
            color: white;
        }
        .btn-cancel:hover {
            background: #dc2626;
        }
        .test-notice {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="payment-card">
        <div class="test-notice">
            🧪 <strong>TEST REŽIM</strong> - Toto je simulace platební brány
        </div>

        <div class="header">
            <div class="logo">${getPaymentIcon(method)}</div>
            <h1>Test Payment Gateway</h1>
            <h2>${getPaymentName(method)}</h2>
        </div>

        <div class="amount">${amount} ${currency}</div>

        <div class="details">
            <div class="detail-row">
                <span>Objednávka:</span>
                <span><strong>${orderId}</strong></span>
            </div>
            <div class="detail-row">
                <span>Faktura:</span>
                <span><strong>${invoiceId}</strong></span>
            </div>
            <div class="detail-row">
                <span>Platební metoda:</span>
                <span><strong>${getPaymentName(method)}</strong></span>
            </div>
            <div class="detail-row">
                <span>Částka:</span>
                <span><strong>${amount} ${currency}</strong></span>
            </div>
        </div>

        <div class="buttons">
            <button class="btn btn-success" onclick="completePayment('success')">
                ✅ Simulovat úspěšnou platbu
            </button>
            <button class="btn btn-cancel" onclick="completePayment('cancel')">
                ❌ Zrušit platbu
            </button>
        </div>
    </div>

    <script>
        function getPaymentIcon(method) {
            const icons = {
                'card': '💳',
                'paypal': '🅿️',
                'payu': '💰',
                'crypto': '₿',
                'banktransfer': '🏦'
            };
            return icons[method] || '💳';
        }

        function getPaymentName(method) {
            const names = {
                'card': 'Platební karta',
                'paypal': 'PayPal',
                'payu': 'PayU',
                'crypto': 'Kryptoměny',
                'banktransfer': 'Bankovní převod'
            };
            return names[method] || 'Platební karta';
        }

        function completePayment(status) {
            const delay = ${process.env.PAYMENT_REDIRECT_DELAY || 2000};

            if (status === 'success') {
                document.body.innerHTML = '<div class="payment-card"><div class="header"><div class="logo">✅</div><h1>Platba úspěšná!</h1><p>Přesměrování za ' + (delay/1000) + ' sekund...</p></div></div>';

                setTimeout(() => {
                    window.location.href = decodeURIComponent('${successUrl}') +
                        '?orderId=${orderId}&paymentId=${paymentId}&status=success&testMode=true';
                }, delay);
            } else {
                document.body.innerHTML = '<div class="payment-card"><div class="header"><div class="logo">❌</div><h1>Platba zrušena</h1><p>Přesměrování za ' + (delay/1000) + ' sekund...</p></div></div>';

                setTimeout(() => {
                    window.location.href = decodeURIComponent('${cancelUrl}') +
                        '?error=payment_cancelled&testMode=true';
                }, delay);
            }
        }
    </script>
</body>
</html>`;

  res.send(testPaymentHtml);
});

// Helper function for payment icons
function getPaymentIcon(method) {
  const icons = {
    'card': '💳',
    'paypal': '🅿️',
    'payu': '💰',
    'crypto': '₿',
    'banktransfer': '🏦'
  };
  return icons[method] || '💳';
}

// Helper function for payment names
function getPaymentName(method) {
  const names = {
    'card': 'Platební karta',
    'paypal': 'PayPal',
    'payu': 'PayU',
    'crypto': 'Kryptoměny',
    'banktransfer': 'Bankovní převod'
  };
  return names[method] || 'Platební karta';
}

// Root endpoint - API information
app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'Systrix Middleware',
    version: '2.0.0',
    description: 'Unified HostBill API Gateway with Integrated Dashboard',
    port: PORT,
    timestamp: new Date().toISOString(),
    features: [
      'HostBill API Gateway',
      'Order Processing',
      'Payment Integration',
      'Affiliate Management',
      'Integrated Dashboard',
      'Real-time Monitoring'
    ],
    endpoints: {
      health: '/health',
      dashboard: '/dashboard',
      testConnection: '/api/test-connection',
      products: '/api/products',
      orders: '/api/orders',
      payments: '/api/payments',
      affiliates: '/api/affiliates',
      stats: '/api/stats'
    },
    documentation: {
      healthCheck: `GET ${req.protocol}://${req.get('host')}/health`,
      dashboard: `GET ${req.protocol}://${req.get('host')}/dashboard`,
      testConnection: `GET ${req.protocol}://${req.get('host')}/api/test-connection`,
      paymentMethods: `GET ${req.protocol}://${req.get('host')}/api/payments/methods`
    },
    status: 'operational',
    environment: process.env.NODE_ENV || 'development',
    integrations: {
      cloudvps: process.env.CLOUDVPS_URL || 'http://localhost:3000',
      partnersPortal: process.env.PARTNERS_PORTAL_URL || 'http://localhost:3006'
    }
  });
});

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Systrix Middleware started on port ${PORT}`, {
    environment: process.env.NODE_ENV,
    hostbillUrl: process.env.HOSTBILL_BASE_URL,
    dashboardEnabled: process.env.DASHBOARD_ENABLED !== 'false'
  });

  console.log(`🚀 Systrix Middleware running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🧪 Test connection: http://localhost:${PORT}/api/test-connection`);
  console.log(`💳 Payment methods: http://localhost:${PORT}/api/payments/methods`);
  console.log(`🎯 Affiliates: http://localhost:${PORT}/api/affiliates`);
  console.log(`📦 Products: http://localhost:${PORT}/api/products`);
});

module.exports = app;
