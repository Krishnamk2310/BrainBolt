/**
 * Redis Service
 * 
 * Handles all Redis operations for caching user state,
 * question pools, and leaderboard sorted sets.
 */

import { redisClient } from '../config';
import { Server } from 'socket.io';
import { UserState, LeaderboardEntry, Question } from '@brainbolt/shared-types';

let io: Server | null = null;

export const setIo = (socketIo: Server) => {
  io = socketIo;
};

// ============================================
// REDIS KEY PREFIXES
// ============================================

const KEYS = {
  USER_STATE: (userId: string) => `user:${userId}:state`,
  QUESTION_POOL: (difficulty: number) => `difficulty:${difficulty}:questions`,
  LEADERBOARD_SCORE: 'leaderboard:score',
  LEADERBOARD_STREAK: 'leaderboard:streak',
  IDEMPOTENCY: (key: string) => `idempotency:${key}`,
};

// ============================================
// USER STATE CACHE
// ============================================

/**
 * Cache user state in Redis
 */
export async function cacheUserState(state: UserState): Promise<void> {
  const key = KEYS.USER_STATE(state.userId);
  const data = JSON.stringify({
    userId: state.userId,
    score: state.score,
    streak: state.streak,
    maxStreak: state.maxStreak,
    difficulty: state.difficulty,
    confidence: state.confidence,
    multiplier: state.multiplier,
    currentQuestionId: state.currentQuestionId,
    stateVersion: state.stateVersion,
    lastActivityAt: state.lastActivityAt.toISOString(),
  });
  
  // Expire after 1 hour
  await redisClient.setex(key, 3600, data);

  // Emit socket update
  if (io) {
    io.to(state.userId).emit('user:update', state);
  }
}

/**
 * Get cached user state
 */
export async function getCachedUserState(userId: string): Promise<UserState | null> {
  const key = KEYS.USER_STATE(userId);
  const data = await redisClient.get(key);
  
  if (!data) {
    return null;
  }
  
  const parsed = JSON.parse(data);
  return {
    ...parsed,
    lastActivityAt: new Date(parsed.lastActivityAt),
  };
}

/**
 * Invalidate user state cache
 */
export async function invalidateUserStateCache(userId: string): Promise<void> {
  const key = KEYS.USER_STATE(userId);
  await redisClient.del(key);
}

// ============================================
// LEADERBOARD OPERATIONS
// ============================================

/**
 * Update user score in leaderboard
 */
export async function updateScoreLeaderboard(
  userId: string,
  username: string,
  score: number
): Promise<void> {
  const pipeline = redisClient.pipeline();
  
  // Update sorted set
  pipeline.zadd(KEYS.LEADERBOARD_SCORE, score, userId);
  
  // Store username
  pipeline.hset(`leaderboard:usernames`, userId, username);
  
  // Expire after 24 hours
  pipeline.expire(`leaderboard:usernames`, 86400);
  
  await pipeline.exec();

  // Emit leaderboard update
  if (io) {
    io.to('leaderboard').emit('leaderboard:update', { type: 'score' });
  }
}

/**
 * Update user streak in leaderboard
 */
export async function updateStreakLeaderboard(
  userId: string,
  maxStreak: number
): Promise<void> {
  await redisClient.zadd(KEYS.LEADERBOARD_STREAK, maxStreak, userId);

  // Emit leaderboard update
  if (io) {
    io.to('leaderboard').emit('leaderboard:update', { type: 'streak' });
  }
}

/**
 * Get score leaderboard from Redis
 */
export async function getScoreLeaderboardRedis(limit: number = 100): Promise<LeaderboardEntry[]> {
  // Get top scores (highest first)
  const results = await redisClient.zrevrange(
    KEYS.LEADERBOARD_SCORE,
    0,
    limit - 1,
    'WITHSCORES'
  );
  
  const entries: LeaderboardEntry[] = [];
  
  for (let i = 0; i < results.length; i += 2) {
    const userId = results[i];
    const score = parseInt(results[i + 1]);
    const username = await redisClient.hget(`leaderboard:usernames`, userId) || 'Unknown';
    
    entries.push({
      rank: (i / 2) + 1,
      userId,
      username,
      value: score,
    });
  }
  
  return entries;
}

/**
 * Get streak leaderboard from Redis
 */
export async function getStreakLeaderboardRedis(limit: number = 100): Promise<LeaderboardEntry[]> {
  // Get top streaks (highest first)
  const results = await redisClient.zrevrange(
    KEYS.LEADERBOARD_STREAK,
    0,
    limit - 1,
    'WITHSCORES'
  );
  
  const entries: LeaderboardEntry[] = [];
  
  for (let i = 0; i < results.length; i += 2) {
    const userId = results[i];
    const streak = parseInt(results[i + 1]);
    const username = await redisClient.hget(`leaderboard:usernames`, userId) || 'Unknown';
    
    entries.push({
      rank: (i / 2) + 1,
      userId,
      username,
      value: streak,
    });
  }
  
  return entries;
}

// ============================================
// QUESTION CACHE
// ============================================

/**
 * Cache questions by difficulty
 */
export async function cacheQuestions(difficulty: number, questions: Question[]): Promise<void> {
  const key = KEYS.QUESTION_POOL(difficulty);
  await redisClient.setex(key, 3600, JSON.stringify(questions));
}

/**
 * Get cached questions by difficulty
 */
export async function getCachedQuestions(difficulty: number): Promise<Question[] | null> {
  const key = KEYS.QUESTION_POOL(difficulty);
  const data = await redisClient.get(key);
  
  if (!data) {
    return null;
  }
  
  return JSON.parse(data);
}

// ============================================
// IDEMPOTENCY CHECK
// ============================================

/**
 * Check and set idempotency key
 * Returns true if already exists (duplicate), false if new
 */
export async function checkAndSetIdempotency(key: string): Promise<boolean> {
  const idempotencyKey = KEYS.IDEMPOTENCY(key);
  
  // Use SETNX for atomic check-and-set
  const result = await redisClient.setnx(idempotencyKey, '1');
  
  if (result === 1) {
    // Set expiration (24 hours)
    await redisClient.expire(idempotencyKey, 86400);
    return false;
  }
  
  return true;
}

// ============================================
// REDIS TRANSACTION HELPERS
// ============================================

/**
 * Execute multiple operations atomically
 */
export async function executeAtomic<T>(
  operations: (pipeline: ReturnType<typeof redisClient.pipeline>) => void
): Promise<T[]> {
  const pipeline = redisClient.pipeline();
  operations(pipeline);
  const results = await pipeline.exec();
  
  if (!results) {
    return [];
  }
  
  return results.map(r => r[1]) as T[];
}
