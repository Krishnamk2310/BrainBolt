/**
 * Database and Redis Configuration
 * 
 * Manages PostgreSQL and Redis connections for the API.
 */

import { Pool } from 'pg';
import Redis from 'ioredis';

// ============================================
// ENVIRONMENT VARIABLES
// ============================================

const POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
const POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT || '5432');
const POSTGRES_USER = process.env.POSTGRES_USER || 'brainbolt';
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'brainbolt';
const POSTGRES_DB = process.env.POSTGRES_DB || 'brainbolt';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

// ============================================
// POSTGRES CONFIGURATION
// ============================================

export const postgresPool = new Pool({
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

postgresPool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});

// ============================================
// REDIS CONFIGURATION
// ============================================

export const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: 3,
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// ============================================
// REDIS PUBSUB FOR SOCKET.IO
// ============================================

export const redisPubClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
});

export const redisSubClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
});

// ============================================
// CONNECTION TEST
// ============================================

export async function testConnections(): Promise<boolean> {
  try {
    const pgTest = await postgresPool.query('SELECT NOW()');
    console.log('PostgreSQL connected:', pgTest.rows[0]);
    
    const redisTest = await redisClient.ping();
    console.log('Redis connected:', redisTest);
    
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}
