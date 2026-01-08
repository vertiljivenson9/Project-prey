'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const AuthMiddleware = require('./middleware/AuthMiddleware');
const ErrorHandler = require('./middleware/ErrorHandler');

const AuthController = require('./controllers/AuthController');
const ProjectController = require('./controllers/ProjectController');
const PreviewController = require('./controllers/PreviewController');

const redisClient = require('./services/RedisClient');

const app = express();

const PORT = process.env.PORT || 3000;

/* -------------------- Security & Core Middleware -------------------- */

app.use(helmet());

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'],
  credentials: true
}));

app.use(compression());

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  max: Number(process.env.MAX_REQUESTS_PER_WINDOW) || 100,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ------------------------------ Routes ------------------------------ */

app.use('/api/v1/auth', AuthController);
app.use('/api/v1/projects', AuthMiddleware, ProjectController);
app.use('/api/v1/preview', AuthMiddleware, PreviewController);

/* --------------------------- Health Check --------------------------- */

app.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: redisClient.isReady() ? 'connected' : 'disconnected'
  });
});

/* -------------------------- Error Handler --------------------------- */

app.use(ErrorHandler);

/* ----------------------------- Startup ------------------------------ */

const server = app.listen(PORT, async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Redis connection failed:', err.message);
  }

  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});

/* ------------------------ Graceful Shutdown ------------------------- */

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('Shutting down server');
  server.close(async () => {
    try {
      await redisClient.disconnect();
    } catch (err) {
      console.error('Redis disconnect error:', err.message);
    }
    process.exit(0);
  });
}

module.exports = app;
