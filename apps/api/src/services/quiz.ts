/**
 * Quiz Service
 * 
 * Handles quiz logic including getting questions,
 * processing answers, and managing user state.
 */

import { AdaptiveEngine } from '@brainbolt/adaptive-engine';
import * as db from './database';
import * as redis from './redis';
import { UserState, Question, QuestionResponse, AnswerResult, UserMetrics } from '@brainbolt/shared-types';

// ============================================
// QUESTION OPERATIONS
// ============================================

/**
 * Get the next question for a user
 * Uses cached state if available, otherwise fetches from DB
 */
export async function getNextQuestion(userId: string): Promise<QuestionResponse> {
  // Get user state (from cache first, then DB)
  let userState = await redis.getCachedUserState(userId);
  
  if (!userState) {
    userState = await db.getUserState(userId);
    if (!userState) {
      throw new Error('User state not found');
    }
    // Cache for future requests
    await redis.cacheUserState(userState);
  }
  
  // Get question at current difficulty level
  const question = await db.getQuestionByDifficulty(userState.difficulty);
  
  if (!question) {
    throw new Error('No questions available');
  }
  
  // Update current question in state
  await db.updateUserState(userId, {
    currentQuestionId: question.id,
    lastActivityAt: new Date(),
  });
  
  return {
    question,
    stateVersion: userState.stateVersion,
  };
}

// ============================================
// ANSWER OPERATIONS
// ============================================

/**
 * Process an answer submission
 * Implements idempotency check and state validation
 */
export async function processAnswer(
  userId: string,
  questionId: string,
  selectedIndex: number,
  stateVersion: number,
  answerIdempotencyKey: string
): Promise<AnswerResult> {
  // Check idempotency - prevent duplicate submissions
  const isDuplicate = await redis.checkAndSetIdempotency(answerIdempotencyKey);
  if (isDuplicate) {
    throw new Error('DUPLICATE_ANSWER: This answer has already been submitted');
  }
  
  // Also check in database for persistence
  const dbDuplicate = await db.checkAnswerIdempotency(answerIdempotencyKey);
  if (dbDuplicate) {
    throw new Error('DUPLICATE_ANSWER: This answer has already been submitted');
  }
  
  // Get current user state
  let userState = await redis.getCachedUserState(userId);
  if (!userState) {
    userState = await db.getUserState(userId);
    if (!userState) {
      throw new Error('User state not found');
    }
  }
  
  // Validate state version - prevent answering old questions
  if (stateVersion !== userState.stateVersion) {
    throw new Error('STATE_VERSION_MISMATCH: The question has been updated. Please refresh.');
  }
  
  // Validate question - must be current question
  if (userState.currentQuestionId !== questionId) {
    throw new Error('INVALID_QUESTION: This is not the current question');
  }
  
  // Get the question to check answer
  const question = await db.getQuestionByDifficulty(userState.difficulty);
  if (!question || question.id !== questionId) {
    throw new Error('QUESTION_NOT_FOUND');
  }
  
  const correct = selectedIndex === question.correctIndex;
  
  // Get recent answers for performance calculation
  const recentAnswers = await db.getRecentAnswers(userId, 5);
  const recentPerformance = AdaptiveEngine.calculateRecentPerformance(recentAnswers);
  
  // Process answer through adaptive engine
  const result = AdaptiveEngine.processAnswer(userState, correct, recentPerformance);
  result.correctIndex = question.correctIndex;
  
  // Update user state in database
  await db.updateUserState(userId, {
    score: result.newScore,
    streak: result.newStreak,
    maxStreak: result.newMaxStreak,
    difficulty: result.newDifficulty,
    confidence: result.newConfidence,
    multiplier: result.newMultiplier,
    stateVersion: result.newStateVersion,
    lastActivityAt: new Date(),
  });
  
  // Log the answer
  await db.logAnswer(
    userId,
    questionId,
    selectedIndex,
    correct,
    result.scoreDelta,
    userState.difficulty
  );
  
  // Update Redis cache
  const updatedState: UserState = {
    userId,
    score: result.newScore,
    streak: result.newStreak,
    maxStreak: result.newMaxStreak,
    difficulty: result.newDifficulty,
    confidence: result.newConfidence,
    multiplier: result.newMultiplier,
    currentQuestionId: null, // Clear current question after answering
    stateVersion: result.newStateVersion,
    lastActivityAt: new Date(),
  };
  await redis.cacheUserState(updatedState);
  
  // Update leaderboards
  const user = await db.getUserById(userId);
  if (user) {
    await redis.updateScoreLeaderboard(userId, user.username, result.newScore);
    await redis.updateStreakLeaderboard(userId, result.newMaxStreak);
  }
  
  return result;
}

// ============================================
// USER STATE
// ============================================

/**
 * Get current user state
 */
export async function getUserState(userId: string): Promise<UserState | null> {
  // Try cache first
  let state = await redis.getCachedUserState(userId);
  
  if (!state) {
    // Fetch from database
    state = await db.getUserState(userId);
    if (state) {
      await redis.cacheUserState(state);
    }
  }
  
  return state;
}

// ============================================
// METRICS
// ============================================

/**
 * Get user performance metrics
 */
export async function getUserMetrics(userId: string): Promise<UserMetrics> {
  // Get basic metrics
  const metrics = await db.getUserMetrics(userId);
  const state = await db.getUserState(userId);
  const distribution = await db.getDifficultyDistribution(userId);
  
  // Get recent performance
  const recentAnswers = await db.getRecentAnswers(userId, 5);
  const recentPerformance = AdaptiveEngine.calculateRecentPerformance(recentAnswers);
  
  // Get difficulty distribution
  const difficultyDistribution = await db.getDifficultyDistribution(userId);
  
  return {
    userId,
    totalQuestions: metrics?.totalQuestions || 0,
    correctAnswers: metrics?.correctAnswers || 0,
    accuracy: metrics ? metrics.correctAnswers / metrics.totalQuestions : 0,
    averageDifficulty: metrics?.averageDifficulty || 1,
    highestDifficulty: metrics?.highestDifficulty || 1,
    totalScore: state?.score || 0,
    currentStreak: state?.streak || 0,
    maxStreak: state?.maxStreak || 0,
    recentPerformance,
    difficultyDistribution,
  };
}
