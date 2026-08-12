const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const loggerMiddleware = require('./middlewares/loggerMiddleware');

const authRoutes = require('./routes/authRoutes');
const assetRoutes = require('./routes/assetRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const transferRoutes = require('./routes/transferRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const expenditureRoutes = require('./routes/expenditureRoutes');
const auditRoutes = require('./routes/auditRoutes');
const baseRoutes = require('./routes/baseRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Military Asset Management System API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/expenditures', expenditureRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/bases', baseRoutes);
app.use('/api/equipment', equipmentRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Military Asset Management API Server running on port ${PORT}`);
  });
}

module.exports = app;
