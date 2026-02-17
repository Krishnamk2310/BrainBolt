/**
 * BrainBolt Shared Types
 * 
 * This package contains all TypeScript interfaces used across
 * the BrainBolt platform (frontend, backend, and shared packages).
 */

// ============================================
// USER & AUTH TYPES
// ============================================

export interface User {
  id: string;
  username: string;
  createdAt: Date;
}

// ============================================
// QUESTION TYPES
// ============================================

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  difficulty: number; // 1-10
  category: string;
  createdAt: Date;
}

export interface QuestionResponse {
  question: Question;
  stateVersion: number;
}

// ============================================
// USER STATE TYPES
// ============================================

export interface UserState {
  userId: string;
  score: number;
  streak: number;
  maxStreak: number;
  difficulty: number; // 1-10
  confidence: number; // [-5, +5]
  multiplier: number;
  currentQuestionId: string | null;
  stateVersion: number;
  lastActivityAt: Date;
}

// ============================================
// ANSWER SUBMISSION TYPES
// ============================================

export interface AnswerSubmission {
  questionId: string;
  selectedIndex: number;
  stateVersion: number;
  answerIdempotencyKey: string;
}

export interface AnswerResult {
  correct: boolean;
  correctIndex: number;
  scoreDelta: number;
  newScore: number;
  newStreak: number;
  newMaxStreak: number;
  newDifficulty: number;
  newMultiplier: number;
  newConfidence: number;
  newStateVersion: number;
}

// ============================================
// LEADERBOARD TYPES
// ============================================

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  value: number;
}

export interface ScoreLeaderboardEntry extends LeaderboardEntry {
  value: number; // total score
}

export interface StreakLeaderboardEntry extends LeaderboardEntry {
  value: number; // max streak
}

// ============================================
// METRICS TYPES
// ============================================

export interface UserMetrics {
  userId: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageDifficulty: number;
  highestDifficulty: number;
  totalScore: number;
  currentStreak: number;
  maxStreak: number;
  recentPerformance: number; // last 5 answers accuracy %
  difficultyDistribution: Record<number, number>;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// SOCKET EVENT TYPES
// ============================================

export interface LeaderboardUpdateEvent {
  type: 'score' | 'streak';
  entries: LeaderboardEntry[];
}

export interface UserUpdateEvent {
  userId: string;
  score: number;
  streak: number;
  maxStreak: number;
  difficulty: number;
}

export interface DifficultyUpdateEvent {
  userId: string;
  difficulty: number;
  reason: 'increase' | 'decrease' | 'unchanged';
}

// ============================================
// DATABASE ROW TYPES (for internal use)
// ============================================

export interface UserRow {
  id: string;
  username: string;
  created_at: Date;
}

export interface QuestionRow {
  id: string;
  text: string;
  options: string[];
  correct_index: number;
  difficulty: number;
  category: string;
  created_at: Date;
}

export interface UserStateRow {
  user_id: string;
  score: number;
  streak: number;
  max_streak: number;
  difficulty: number;
  confidence: number;
  multiplier: number;
  current_question_id: string | null;
  state_version: number;
  last_activity_at: Date;
}

export interface AnswerLogRow {
  id: string;
  user_id: string;
  question_id: string;
  selected_index: number;
  correct: boolean;
  score_delta: number;
  difficulty: number;
  created_at: Date;
}

export interface LeaderboardScoreRow {
  user_id: string;
  username: string;
  total_score: number;
}

export interface LeaderboardStreakRow {
  user_id: string;
  username: string;
  max_streak: number;
}
