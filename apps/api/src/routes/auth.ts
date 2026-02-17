/**
 * Auth Routes
 * 
 * Simple username-based authentication:
 * - POST /v1/auth/login - Create or get user by username
 */

import { Router, Request, Response } from 'express';
import * as db from '../services/database';
import { ApiResponse, User } from '@brainbolt/shared-types';

const router = Router();

// ============================================
// POST /v1/auth/login
// ============================================

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    
    if (!username || typeof username !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Username is required',
      } as ApiResponse<any>);
    }
    
    // Sanitize username
    const sanitizedUsername = username.trim().slice(0, 50);
    
    if (sanitizedUsername.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Username must be at least 2 characters',
      } as ApiResponse<any>);
    }
    
    // Create or get user
    const user = await db.createOrGetUser(sanitizedUsername);
    
    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt,
        },
      },
    } as ApiResponse<{ user: User }>);
  } catch (error) {
    console.error('Error in /v1/auth/login:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as ApiResponse<any>);
  }
});

export default router;
