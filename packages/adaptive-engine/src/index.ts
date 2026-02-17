/**
 * BrainBolt Adaptive Engine
 * 
 * Implements the adaptive difficulty algorithm with:
 * - Confidence-based difficulty adjustment
 * - Hysteresis to prevent oscillation
 * - Streak tracking and multiplier system
 * - Score calculation with performance factors
 * 
 * Algorithm Rules:
 * - Difficulty range: 1 → 10
 * - Confidence: [-5, +5]
 * - Difficulty changes only when confidence >= +3 (increase) or <= -3 (decrease)
 * - After change, confidence resets to 0
 */

import { UserState, AnswerResult } from '@brainbolt/shared-types';

// ============================================
// ALGORITHM CONSTANTS
// ============================================

const DIFFICULTY_MIN = 1;
const DIFFICULTY_MAX = 10;

const CONFIDENCE_MIN = -5;
const CONFIDENCE_MAX = +5;

const CONFIDENCE_THRESHOLD_INCREASE = +3;
const CONFIDENCE_THRESHOLD_DECREASE = -3;

const STREAK_DECAY_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
const STREAK_DECAY_FACTOR = 0.5;

const MULTIPLIER_CAP = 3.5;

const BASE_SCORE_MULTIPLIER = 10;

// ============================================
// ADAPTIVE ENGINE
// ============================================

export class AdaptiveEngine {
  /**
   * Process an answer and calculate new state
   * 
   * @param currentState - Current user state
   * @param correct - Whether the answer was correct
   * @param recentPerformance - Recent performance (0-1) based on last 5 answers
   * @returns Updated state and result details
   */
  static processAnswer(
    currentState: UserState,
    correct: boolean,
    recentPerformance: number
  ): AnswerResult {
    // Calculate new confidence
    let newConfidence = currentState.confidence;
    
    if (correct) {
      // Correct answer: confidence += 1.2 + (streak * 0.1)
      newConfidence += 1.2 + (currentState.streak * 0.1);
    } else {
      // Wrong answer: confidence -= 1.5
      newConfidence -= 1.5;
    }
    
    // Clamp confidence to valid range
    newConfidence = this.clampConfidence(newConfidence);
    
    // Calculate new difficulty based on confidence
    let newDifficulty = currentState.difficulty;
    let difficultyReason: 'increase' | 'decrease' | 'unchanged' = 'unchanged';
    
    if (newConfidence >= CONFIDENCE_THRESHOLD_INCREASE && currentState.difficulty < DIFFICULTY_MAX) {
      // Increase difficulty
      newDifficulty = Math.min(currentState.difficulty + 1, DIFFICULTY_MAX);
      newConfidence = 0; // Reset confidence after change
      difficultyReason = 'increase';
    } else if (newConfidence <= CONFIDENCE_THRESHOLD_DECREASE && currentState.difficulty > DIFFICULTY_MIN) {
      // Decrease difficulty
      newDifficulty = Math.max(currentState.difficulty - 1, DIFFICULTY_MIN);
      newConfidence = 0; // Reset confidence after change
      difficultyReason = 'decrease';
    }
    
    // Calculate new streak
    let newStreak = correct ? currentState.streak + 1 : 0;
    let newMaxStreak = Math.max(currentState.maxStreak, newStreak);
    
    // Apply streak decay if inactive
    const now = new Date();
    const lastActivity = new Date(currentState.lastActivityAt);
    const timeSinceLastActivity = now.getTime() - lastActivity.getTime();
    
    if (timeSinceLastActivity > STREAK_DECAY_THRESHOLD_MS) {
      // Decay streak by 50%
      newStreak = Math.floor(newStreak * STREAK_DECAY_FACTOR);
      newMaxStreak = Math.max(currentState.maxStreak, newStreak);
    }
    
    // Calculate multiplier
    const newMultiplier = this.calculateMultiplier(newStreak);
    
    // Calculate score delta
    const scoreDelta = this.calculateScoreDelta(
      currentState.difficulty,
      correct,
      newMultiplier,
      recentPerformance
    );
    
    const newScore = currentState.score + scoreDelta;
    const newStateVersion = currentState.stateVersion + 1;
    
    return {
      correct,
      correctIndex: -1, // Will be set by caller
      scoreDelta,
      newScore,
      newStreak,
      newMaxStreak,
      newDifficulty,
      newMultiplier,
      newConfidence,
      newStateVersion
    };
  }

  /**
   * Calculate streak multiplier
   * Formula: min(1 + (streak / 5), 3.5)
   */
  static calculateMultiplier(streak: number): number {
    return Math.min(1 + (streak / 5), MULTIPLIER_CAP);
  }

  /**
   * Calculate score delta
   * 
   * Formula:
   * base = difficulty * 10
   * accuracyFactor = 1 if correct else 0
   * scoreDelta = base * accuracyFactor * multiplier * (0.6 + recentPerformance)
   */
  static calculateScoreDelta(
    difficulty: number,
    correct: boolean,
    multiplier: number,
    recentPerformance: number
  ): number {
    if (!correct) {
      return 0;
    }
    
    const base = difficulty * BASE_SCORE_MULTIPLIER;
    const accuracyFactor = 1;
    const performanceFactor = 0.6 + recentPerformance;
    
    const scoreDelta = Math.round(base * accuracyFactor * multiplier * performanceFactor);
    
    return Math.max(1, scoreDelta); // Minimum 1 point for correct answer
  }

  /**
   * Calculate recent performance (last N answers accuracy)
   */
  static calculateRecentPerformance(recentAnswers: boolean[], count: number = 5): number {
    if (recentAnswers.length === 0) {
      return 0.5; // Default middle ground for new users
    }
    
    const relevantAnswers = recentAnswers.slice(-count);
    const correctCount = relevantAnswers.filter(a => a).length;
    
    return correctCount / relevantAnswers.length;
  }

  /**
   * Check if difficulty should change based on current confidence
   */
  static shouldChangeDifficulty(confidence: number, currentDifficulty: number): {
    shouldChange: boolean;
    newDifficulty: number;
    reason: 'increase' | 'decrease' | 'unchanged';
  } {
    if (confidence >= CONFIDENCE_THRESHOLD_INCREASE && currentDifficulty < DIFFICULTY_MAX) {
      return {
        shouldChange: true,
        newDifficulty: Math.min(currentDifficulty + 1, DIFFICULTY_MAX),
        reason: 'increase'
      };
    }
    
    if (confidence <= CONFIDENCE_THRESHOLD_DECREASE && currentDifficulty > DIFFICULTY_MIN) {
      return {
        shouldChange: true,
        newDifficulty: Math.max(currentDifficulty - 1, DIFFICULTY_MIN),
        reason: 'decrease'
      };
    }
    
    return {
      shouldChange: false,
      newDifficulty: currentDifficulty,
      reason: 'unchanged'
    };
  }

  /**
   * Clamp confidence to valid range [-5, +5]
   */
  static clampConfidence(confidence: number): number {
    return Math.max(CONFIDENCE_MIN, Math.min(CONFIDENCE_MAX, confidence));
  }

  /**
   * Clamp difficulty to valid range [1, 10]
   */
  static clampDifficulty(difficulty: number): number {
    return Math.max(DIFFICULTY_MIN, Math.min(DIFFICULTY_MAX, difficulty));
  }

  /**
   * Apply streak decay for inactivity
   */
  static applyStreakDecay(streak: number, lastActivityTime: Date): number {
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - lastActivityTime.getTime();
    
    if (timeSinceLastActivity > STREAK_DECAY_THRESHOLD_MS) {
      return Math.floor(streak * STREAK_DECAY_FACTOR);
    }
    
    return streak;
  }

  /**
   * Get difficulty label for display
   */
  static getDifficultyLabel(difficulty: number): string {
    if (difficulty <= 2) return 'Very Easy';
    if (difficulty <= 4) return 'Easy';
    if (difficulty <= 6) return 'Medium';
    if (difficulty <= 8) return 'Hard';
    return 'Expert';
  }

  /**
   * Get confidence label for display
   */
  static getConfidenceLabel(confidence: number): string {
    if (confidence >= 3) return 'Very Confident';
    if (confidence >= 1) return 'Confident';
    if (confidence >= -1) return 'Neutral';
    if (confidence >= -3) return 'Unsure';
    return 'Struggling';
  }
}

export default AdaptiveEngine;
