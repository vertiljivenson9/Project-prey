'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const redisClient = require('../services/RedisClient');
const AuthMiddleware = require('../middleware/AuthMiddleware');

const router = express.Router();

/*
  Usuarios de demostración.
  En producción esto debe venir de una base de datos.
*/
const DEMO_USERS = [
  {
    id: 'demo-user-1',
    email: 'demo@zprey.com',
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYbW4qQqGUi',
    name: 'Demo User'
  }
];

/* ------------------------------ Login ------------------------------ */

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = DEMO_USERS.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '24h',
        issuer: 'zprey',
        subject: user.id
      }
    );

    await redisClient.setEx(
      `token:${token}`,
      60 * 60 * 24,
      JSON.stringify({
        userId: user.id,
        createdAt: new Date().toISOString()
      })
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      expiresIn: '24h'
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

/* ------------------------------ Verify ----------------------------- */

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'zprey'
      });
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const tokenExists = await redisClient.get(`token:${token}`);

    if (!tokenExists) {
      return res.status(401).json({ error: 'Token revoked' });
    }

    res.json({
      valid: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name
      },
      expiresAt: new Date(decoded.exp * 1000).toISOString()
    });
  } catch (error) {
    console.error('Verify error:', error.message);
    res.status(500).json({ error: 'Token verification failed' });
  }
});

/* ------------------------------ Logout ----------------------------- */

router.post('/logout', AuthMiddleware, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];

    await redisClient.del(`token:${token}`);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error.message);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
