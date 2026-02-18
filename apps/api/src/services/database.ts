/**
 * Database Service
 * 
 * Handles all PostgreSQL operations for the BrainBolt API.
 * Implements user management, questions, answers, and leaderboard queries.
 */

import { postgresPool } from '../config';
import {
  User,
  Question,
  UserState,
  AnswerLogRow,
  LeaderboardScoreRow,
  LeaderboardStreakRow,
} from '@brainbolt/shared-types';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// USER OPERATIONS
// ============================================

/**
 * Create a new user or get existing by username
 */
export async function createOrGetUser(username: string): Promise<User> {
  // Check if user exists
  const existingUser = await postgresPool.query(
    'SELECT id, username, created_at FROM users WHERE username = $1',
    [username]
  );

  if (existingUser.rows.length > 0) {
    const user = existingUser.rows[0];
    
    // Ensure user state exists (in case of partial creation failure)
    const existingState = await postgresPool.query(
      'SELECT 1 FROM user_state WHERE user_id = $1',
      [user.id]
    );
    
    if (existingState.rows.length === 0) {
      await postgresPool.query(
        `INSERT INTO user_state 
         (user_id, score, streak, max_streak, difficulty, confidence, multiplier, current_question_id, state_version, last_activity_at) 
         VALUES ($1, 0, 0, 0, 1, 0, 1, NULL, 0, NOW())`,
        [user.id]
      );
    }

    return user;
  }

  // Create new user
  const userId = uuidv4();
  const newUser = await postgresPool.query(
    'INSERT INTO users (id, username, created_at) VALUES ($1, $2, NOW()) RETURNING id, username, created_at',
    [userId, username]
  );

  // Create initial user state
  await postgresPool.query(
    `INSERT INTO user_state 
     (user_id, score, streak, max_streak, difficulty, confidence, multiplier, current_question_id, state_version, last_activity_at) 
     VALUES ($1, 0, 0, 0, 1, 0, 1, NULL, 0, NOW())`,
    [userId]
  );

  return newUser.rows[0];
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const result = await postgresPool.query(
    'SELECT id, username, created_at FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

// ============================================
// QUESTION OPERATIONS
// ============================================

/**
 * Get a random question at the specified difficulty level
 * Falls back to nearest difficulty if no questions available
 */
export async function getQuestionByDifficulty(difficulty: number): Promise<Question | null> {
  // Try exact difficulty first
  let result = await postgresPool.query(
    `SELECT id, text, options, correct_index, difficulty, category, created_at 
     FROM questions 
     WHERE difficulty = $1 
     ORDER BY RANDOM() 
     LIMIT 1`,
    [difficulty]
  );

  if (result.rows.length === 0) {
    // Fallback: find nearest difficulty
    result = await postgresPool.query(
      `SELECT id, text, options, correct_index, difficulty, category, created_at 
       FROM questions 
       ORDER BY ABS(difficulty - $1) 
       LIMIT 1`,
      [difficulty]
    );
  }

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    text: row.text,
    options: row.options,
    correctIndex: row.correct_index,
    difficulty: row.difficulty,
    category: row.category,
    createdAt: row.created_at,
  };
}

/**
 * Get question by ID
 */
export async function getQuestionById(questionId: string): Promise<Question | null> {
  const result = await postgresPool.query(
    `SELECT id, text, options, correct_index, difficulty, category, created_at 
     FROM questions 
     WHERE id = $1`,
    [questionId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    text: row.text,
    options: row.options,
    correctIndex: row.correct_index,
    difficulty: row.difficulty,
    category: row.category,
    createdAt: row.created_at,
  };
}

/**
 * Get all questions for a user (for metrics)
 */
export async function getQuestionsForUser(userId: string): Promise<Question[]> {
  const result = await postgresPool.query(
    `SELECT q.id, q.text, q.options, q.correct_index, q.difficulty, q.category, q.created_at
     FROM questions q
     JOIN answer_log al ON al.question_id = q.id
     WHERE al.user_id = $1
     GROUP BY q.id`,
    [userId]
  );

  return result.rows.map(row => ({
    id: row.id,
    text: row.text,
    options: row.options,
    correctIndex: row.correct_index,
    difficulty: row.difficulty,
    category: row.category,
    createdAt: row.created_at,
  }));
}

// ============================================
// USER STATE OPERATIONS
// ============================================

/**
 * Get user state
 */
export async function getUserState(userId: string): Promise<UserState | null> {
  const result = await postgresPool.query(
    `SELECT user_id, score, streak, max_streak, difficulty, confidence, multiplier, 
            current_question_id, state_version, last_activity_at
     FROM user_state 
     WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    userId: row.user_id,
    score: row.score,
    streak: row.streak,
    maxStreak: row.max_streak,
    difficulty: row.difficulty,
    confidence: row.confidence,
    multiplier: row.multiplier,
    currentQuestionId: row.current_question_id,
    stateVersion: row.state_version,
    lastActivityAt: row.last_activity_at,
  };
}

/**
 * Update user state
 */
export async function updateUserState(
  userId: string,
  state: Partial<UserState>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (state.score !== undefined) {
    fields.push(`score = $${paramIndex++}`);
    values.push(state.score);
  }
  if (state.streak !== undefined) {
    fields.push(`streak = $${paramIndex++}`);
    values.push(state.streak);
  }
  if (state.maxStreak !== undefined) {
    fields.push(`max_streak = $${paramIndex++}`);
    values.push(state.maxStreak);
  }
  if (state.difficulty !== undefined) {
    fields.push(`difficulty = $${paramIndex++}`);
    values.push(state.difficulty);
  }
  if (state.confidence !== undefined) {
    fields.push(`confidence = $${paramIndex++}`);
    values.push(state.confidence);
  }
  if (state.multiplier !== undefined) {
    fields.push(`multiplier = $${paramIndex++}`);
    values.push(state.multiplier);
  }
  if (state.currentQuestionId !== undefined) {
    fields.push(`current_question_id = $${paramIndex++}`);
    values.push(state.currentQuestionId);
  }
  if (state.stateVersion !== undefined) {
    fields.push(`state_version = $${paramIndex++}`);
    values.push(state.stateVersion);
  }
  // last_activity_at is always updated to NOW() in the query below
  // if (state.lastActivityAt !== undefined) {
  //   fields.push(`last_activity_at = $${paramIndex++}`);
  //   values.push(state.lastActivityAt);
  // }

  if (fields.length === 0) {
    return;
  }

  values.push(userId);
  await postgresPool.query(
    `UPDATE user_state SET ${fields.join(', ')}, last_activity_at = NOW() WHERE user_id = $${paramIndex}`,
    values
  );
}

/**
 * Ensure user state exists (auto-recovery)
 */
export async function ensureUserState(userId: string): Promise<UserState> {
  let state = await getUserState(userId);
  
  if (!state) {
    // Check if user exists first
    const userExists = await getUserById(userId);
    if (!userExists) {
      throw new Error('User not found');
    }

    // Create default state
    await postgresPool.query(
      `INSERT INTO user_state 
       (user_id, score, streak, max_streak, difficulty, confidence, multiplier, current_question_id, state_version, last_activity_at) 
       VALUES ($1, 0, 0, 0, 1, 0, 1, NULL, 0, NOW())
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );
    
    state = await getUserState(userId);
    if (!state) {
      throw new Error('Failed to create user state');
    }
  }
  
  return state;
}

// ============================================
// ANSWER LOG OPERATIONS
// ============================================

/**
 * Log an answer
 */
export async function logAnswer(
  userId: string,
  questionId: string,
  selectedIndex: number,
  correct: boolean,
  scoreDelta: number,
  difficulty: number,
  idempotencyKey: string
): Promise<void> {
  await postgresPool.query(
    `INSERT INTO answer_log (id, user_id, question_id, selected_index, correct, score_delta, difficulty, idempotency_key, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [uuidv4(), userId, questionId, selectedIndex, correct, scoreDelta, difficulty, idempotencyKey]
  );
}

/**
 * Check if answer idempotency key exists
 */
export async function checkAnswerIdempotency(key: string): Promise<boolean> {
  const result = await postgresPool.query(
    'SELECT 1 FROM answer_log WHERE idempotency_key = $1',
    [key]
  );
  return result.rows.length > 0;
}

/**
 * Get recent answers for a user
 */
export async function getRecentAnswers(userId: string, count: number = 5): Promise<boolean[]> {
  const result = await postgresPool.query(
    `SELECT correct FROM answer_log 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [userId, count]
  );
  return result.rows.map(row => row.correct);
}

// ============================================
// LEADERBOARD OPERATIONS
// ============================================

/**
 * Get score leaderboard
 */
export async function getScoreLeaderboard(limit: number = 100): Promise<LeaderboardScoreRow[]> {
  const result = await postgresPool.query(
    `SELECT us.user_id, u.username, us.score as total_score
     FROM user_state us
     JOIN users u ON u.id = us.user_id
     ORDER BY us.score DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

/**
 * Get streak leaderboard
 */
export async function getStreakLeaderboard(limit: number = 100): Promise<LeaderboardStreakRow[]> {
  const result = await postgresPool.query(
    `SELECT us.user_id, u.username, us.max_streak
     FROM user_state us
     JOIN users u ON u.id = us.user_id
     ORDER BY us.max_streak DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

// ============================================
// METRICS OPERATIONS
// ============================================

/**
 * Get user performance metrics
 */
export async function getUserMetrics(userId: string): Promise<{
  totalQuestions: number;
  correctAnswers: number;
  averageDifficulty: number;
  highestDifficulty: number;
} | null> {
  const result = await postgresPool.query(
    `SELECT 
       COUNT(*) as total_questions,
       SUM(CASE WHEN correct THEN 1 ELSE 0 END) as correct_answers,
       AVG(difficulty)::numeric(5,2) as average_difficulty,
       MAX(difficulty) as highest_difficulty
     FROM answer_log
     WHERE user_id = $1`,
    [userId]
  );

  const row = result.rows[0];
  if (!row || row.total_questions === '0') {
    return null;
  }

  return {
    totalQuestions: parseInt(row.total_questions),
    correctAnswers: parseInt(row.correct_answers),
    averageDifficulty: parseFloat(row.average_difficulty),
    highestDifficulty: parseInt(row.highest_difficulty),
  };
}

/**
 * Get difficulty distribution for a user
 */
export async function getDifficultyDistribution(userId: string): Promise<Record<number, number>> {
  const result = await postgresPool.query(
    `SELECT difficulty, COUNT(*) as count
     FROM answer_log
     WHERE user_id = $1
     GROUP BY difficulty
     ORDER BY difficulty`,
    [userId]
  );

  const distribution: Record<number, number> = {};
  for (let i = 1; i <= 10; i++) {
    distribution[i] = 0;
  }
  for (const row of result.rows) {
    distribution[row.difficulty] = parseInt(row.count);
  }
  return distribution;
}

/**
 * Get user rank by score
 */
export async function getUserRankByScore(userId: string): Promise<number> {
  const result = await postgresPool.query(
    `SELECT COUNT(*) + 1 as rank
     FROM user_state
     WHERE score > (SELECT score FROM user_state WHERE user_id = $1)`,
    [userId]
  );
  return parseInt(result.rows[0].rank);
}

/**
 * Get user rank by streak
 */
export async function getUserRankByStreak(userId: string): Promise<number> {
  const result = await postgresPool.query(
    `SELECT COUNT(*) + 1 as rank
     FROM user_state
     WHERE max_streak > (SELECT max_streak FROM user_state WHERE user_id = $1)`,
    [userId]
  );
  return parseInt(result.rows[0].rank);
}
