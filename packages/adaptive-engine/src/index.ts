import { UserState, AnswerResult } from '@brainbolt/shared-types';

/**
 * Adaptive difficulty engine
 * Difficulty ∈ [1,10]
 * Confidence ∈ [-5,5]
 * Difficulty shifts when confidence crosses ±1 and then resets to 0
 */

const DIFFICULTY_MIN = 1;
const DIFFICULTY_MAX = 10;

const CONFIDENCE_MIN = -5;
const CONFIDENCE_MAX = +5;

const CONFIDENCE_THRESHOLD_INCREASE = +1.0;
const CONFIDENCE_THRESHOLD_DECREASE = -1.0;

const STREAK_DECAY_THRESHOLD_MS = 2 * 60 * 1000;
const STREAK_DECAY_FACTOR = 0.5;

const MULTIPLIER_CAP = 3.5;
const BASE_SCORE_MULTIPLIER = 10;

export class AdaptiveEngine {

  static processAnswer(
    currentState: UserState,
    correct: boolean,
    recentPerformance: number
  ): AnswerResult {

    let newConfidence = Number(currentState.confidence);

    if (correct) newConfidence += 1.2 + (currentState.streak * 0.1);
    else newConfidence -= 1.5;

    newConfidence = this.clampConfidence(newConfidence);

    let newDifficulty = currentState.difficulty;
    let difficultyReason: 'increase' | 'decrease' | 'unchanged' = 'unchanged';

    if (newConfidence >= CONFIDENCE_THRESHOLD_INCREASE && currentState.difficulty < DIFFICULTY_MAX) {
      newDifficulty = Math.min(currentState.difficulty + 1, DIFFICULTY_MAX);
      newConfidence = 0;
      difficultyReason = 'increase';
    } 
    else if (newConfidence <= CONFIDENCE_THRESHOLD_DECREASE && currentState.difficulty > DIFFICULTY_MIN) {
      newDifficulty = Math.max(currentState.difficulty - 1, DIFFICULTY_MIN);
      newConfidence = 0;
      difficultyReason = 'decrease';
    }

    let newStreak = correct ? currentState.streak + 1 : 0;
    let newMaxStreak = Math.max(currentState.maxStreak, newStreak);

    const now = new Date();
    const lastActivity = new Date(currentState.lastActivityAt);

    if (now.getTime() - lastActivity.getTime() > STREAK_DECAY_THRESHOLD_MS) {
      newStreak = Math.floor(newStreak * STREAK_DECAY_FACTOR);
      newMaxStreak = Math.max(currentState.maxStreak, newStreak);
    }

    const newMultiplier = this.calculateMultiplier(newStreak);

    const scoreDelta = this.calculateScoreDelta(
      currentState.difficulty,
      correct,
      newMultiplier,
      recentPerformance
    );

    return {
      correct,
      correctIndex: -1,
      scoreDelta,
      newScore: currentState.score + scoreDelta,
      newStreak,
      newMaxStreak,
      newDifficulty,
      newMultiplier,
      newConfidence,
      newStateVersion: currentState.stateVersion + 1
    };
  }

  static calculateMultiplier(streak: number): number {
    return Math.min(1 + (streak / 5), MULTIPLIER_CAP);
  }

  static calculateScoreDelta(
    difficulty: number,
    correct: boolean,
    multiplier: number,
    recentPerformance: number
  ): number {

    if (!correct) {
      const penalty = Math.round(difficulty * BASE_SCORE_MULTIPLIER * 0.5);
      return -Math.max(1, penalty);
    }

    const base = difficulty * BASE_SCORE_MULTIPLIER;
    const performanceFactor = 0.6 + recentPerformance;

    return Math.max(1, Math.round(base * multiplier * performanceFactor));
  }

  static calculateRecentPerformance(recentAnswers: boolean[], count: number = 5): number {
    if (!recentAnswers.length) return 0.5;
    const r = recentAnswers.slice(-count);
    return r.filter(Boolean).length / r.length;
  }

  static shouldChangeDifficulty(confidence: number, currentDifficulty: number) {
    if (confidence >= CONFIDENCE_THRESHOLD_INCREASE && currentDifficulty < DIFFICULTY_MAX)
      return { shouldChange: true, newDifficulty: currentDifficulty + 1, reason: 'increase' as const };

    if (confidence <= CONFIDENCE_THRESHOLD_DECREASE && currentDifficulty > DIFFICULTY_MIN)
      return { shouldChange: true, newDifficulty: currentDifficulty - 1, reason: 'decrease' as const };

    return { shouldChange: false, newDifficulty: currentDifficulty, reason: 'unchanged' as const };
  }

  static clampConfidence(confidence: number): number {
    return Math.max(CONFIDENCE_MIN, Math.min(CONFIDENCE_MAX, confidence));
  }

  static clampDifficulty(difficulty: number): number {
    return Math.max(DIFFICULTY_MIN, Math.min(DIFFICULTY_MAX, difficulty));
  }

  static applyStreakDecay(streak: number, lastActivityTime: Date): number {
    if (Date.now() - lastActivityTime.getTime() > STREAK_DECAY_THRESHOLD_MS)
      return Math.floor(streak * STREAK_DECAY_FACTOR);
    return streak;
  }

  static getDifficultyLabel(difficulty: number): string {
    if (difficulty <= 2) return 'Very Easy';
    if (difficulty <= 4) return 'Easy';
    if (difficulty <= 6) return 'Medium';
    if (difficulty <= 8) return 'Hard';
    return 'Expert';
  }

  static getConfidenceLabel(confidence: number): string {
    if (confidence >= 3) return 'Very Confident';
    if (confidence >= 1) return 'Confident';
    if (confidence >= -1) return 'Neutral';
    if (confidence >= -3) return 'Unsure';
    return 'Struggling';
  }
}

export default AdaptiveEngine;
