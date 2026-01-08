'use strict';

function required(name, value) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',

  PORT: process.env.PORT || 3000,

  JWT_SECRET: required(
    'JWT_SECRET',
    process.env.JWT_SECRET
  ),

  REDIS_URL: required(
    'REDIS_URL',
    process.env.REDIS_URL
  ),

  PROJECT_TTL_SECONDS: parseInt(
    process.env.PROJECT_TTL_SECONDS || '86400',
    10
  )
};

module.exports = env;
