/**
 * Quiz Routes
 * 
 * API endpoints for quiz operations:
 * - GET /v1/quiz/next - Get next question
 * - POST /v1/quiz/answer - Submit answer
 * - GET /v1/quiz/metrics - Get user metrics
 */

import { Router, Request, Response } from 'express';
import * as quizService from '../services/quiz';
import * as db from '../services/database';
import { ApiResponse } from '@brainbolt/shared-types';

const router = Router();

// ============================================
// GET /v1/quiz/next
// ============================================

router.get('/next', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing user ID',
      } as ApiResponse<any>);
    }
    
    const result = await quizService.getNextQuestion(userId);
    
    // Get current state for response
    const state = await quizService.getUserState(userId);
    
    return res.json({
      success: true,
      data: {
        question: result.question,
        stateVersion: result.stateVersion,
        userState: state,
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error in /v1/quiz/next:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as ApiResponse<any>);
  }
});

// ============================================
// POST /v1/quiz/answer
// ============================================

router.post('/answer', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing user ID',
      } as ApiResponse<any>);
    }
    
    const { questionId, selectedIndex, stateVersion, answerIdempotencyKey } = req.body;
    
    // Validate required fields
    if (!questionId || selectedIndex === undefined || !stateVersion || !answerIdempotencyKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: questionId, selectedIndex, stateVersion, answerIdempotencyKey',
      } as ApiResponse<any>);
    }
    
    const result = await quizService.processAnswer(
      userId,
      questionId,
      selectedIndex,
      stateVersion,
      answerIdempotencyKey
    );
    
    // Get updated state
    const updatedState = await quizService.getUserState(userId);
    
    // Emit socket events for real-time updates
    const io = req.app.get('io');
    if (io) {
      // Notify the specific user
      io.to(userId).emit('user:update', {
        userId,
        score: updatedState?.score,
        streak: updatedState?.streak,
        maxStreak: updatedState?.maxStreak,
        difficulty: updatedState?.difficulty,
      });
      
      // Emit difficulty change if applicable
      if (result.newDifficulty !== updatedState?.difficulty) {
        io.to(userId).emit('difficulty:update', {
          userId,
          difficulty: result.newDifficulty,
          reason: result.newDifficulty > (updatedState?.difficulty || 0) ? 'increase' : 'decrease',
        });
      }
    }
    
    return res.json({
      success: true,
      data: {
        result,
        userState: updatedState,
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error in /v1/quiz/answer:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    // Handle specific error types
    if (errorMessage.includes('DUPLICATE_ANSWER')) {
      return res.status(409).json({
        success: false,
        error: errorMessage,
      } as ApiResponse<any>);
    }
    
    if (errorMessage.includes('STATE_VERSION_MISMATCH')) {
      return res.status(400).json({
        success: false,
        error: errorMessage,
      } as ApiResponse<any>);
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage,
    } as ApiResponse<any>);
  }
});

// ============================================
// GET /v1/quiz/metrics
// ============================================

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing user ID',
      } as ApiResponse<any>);
    }
    
    const metrics = await quizService.getUserMetrics(userId);
    
    return res.json({
      success: true,
      data: metrics,
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error in /v1/quiz/metrics:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as ApiResponse<any>);
  }
});

// ============================================
// GET /v1/quiz/state
// ============================================

router.get('/state', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing user ID',
      } as ApiResponse<any>);
    }
    
    const state = await quizService.getUserState(userId);
    
    if (!state) {
      return res.status(404).json({
        success: false,
        error: 'User state not found',
      } as ApiResponse<any>);
    }
    
    return res.json({
      success: true,
      data: state,
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error in /v1/quiz/state:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } as ApiResponse<any>);
  }
});

export default router;
