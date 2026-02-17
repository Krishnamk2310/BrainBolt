/**
 * Leaderboard Routes
 * 
 * API endpoints for leaderboard operations:
 * - GET /v1/leaderboard/score - Get top users by score
 * - GET /v1/leaderboard/streak - Get top users by streak
 */

import { Router, Request, Response } from 'express';
import * as redis from '../services/redis';
import * as db from '../services/database';
import { ApiResponse, LeaderboardEntry } from '@brainbolt/shared-types';

const router = Router();

// ============================================
// GET /v1/leaderboard/score
// ============================================

router.get('/score', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    
    // Try Redis first for fast response
    let entries = await redis.getScoreLeaderboardRedis(limit);
    
    // Fallback to database if Redis is empty
    if (entries.length === 0) {
      const dbEntries = await db.getScoreLeaderboard(limit);
      
      entries = dbEntries.map((row, index) => ({
        rank: index + 1,
        userId: row.user_id,
        username: row.username,
        value: row.total_score,
      }));
    }
    
    return res.json({
      success: true,
      data: entries,
    } as ApiResponse<LeaderboardEntry[]>);
  } catch (error) {
    console.error('Error in /v1/leaderboard/score:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as ApiResponse<any>);
  }
});

// ============================================
// GET /v1/leaderboard/streak
// ============================================

router.get('/streak', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    
    // Try Redis first for fast response
    let entries = await redis.getStreakLeaderboardRedis(limit);
    
    // Fallback to database if Redis is empty
    if (entries.length === 0) {
      const dbEntries = await db.getStreakLeaderboard(limit);
      
      entries = dbEntries.map((row, index) => ({
        rank: index + 1,
        userId: row.user_id,
        username: row.username,
        value: row.max_streak,
      }));
    }
    
    return res.json({
      success: true,
      data: entries,
    } as ApiResponse<LeaderboardEntry[]>);
  } catch (error) {
    console.error('Error in /v1/leaderboard/streak:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as ApiResponse<any>);
  }
});

export default router;
