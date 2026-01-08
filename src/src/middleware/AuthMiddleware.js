'use strict';

const jwt = require('jsonwebtoken');
const redisClient = require('../services/RedisClient');

module.exports = async function AuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token missing' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'zprey'
      });
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const tokenKey = `token:${token}`;
    const tokenExists = await redisClient.get(tokenKey);

    if (!tokenExists) {
      return res.status(401).json({ error: 'Token revoked' });
    }

    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userName = decoded.name;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
};
