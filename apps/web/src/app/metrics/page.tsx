'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import styles from './metrics.module.css';

interface UserMetrics {
  userId: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageDifficulty: number;
  highestDifficulty: number;
  totalScore: number;
  currentStreak: number;
  maxStreak: number;
  recentPerformance: number;
  difficultyDistribution: Record<number, number>;
}

export default function MetricsPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('brainbolt_userId');
    if (!userId) return router.push('/login');
    api.setUserId(userId);
    fetchMetrics();
  }, [router]);

  const fetchMetrics = async () => {
    setLoading(true);
    setError('');

    const response = await api.getMetrics();
    if (response.success && response.data) setMetrics(response.data);
    else setError(response.error || 'Failed to load metrics');

    setLoading(false);
  };

  if (loading)
    return <div className={styles.centerScreen}>Loading metrics...</div>;

  if (error)
    return <div className={styles.centerScreen}>{error}</div>;

  const maxValue = Math.max(...Object.values(metrics?.difficultyDistribution || {0:0}));

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Your Metrics</h1>
      <p className={styles.subtitle}>Track your performance over time</p>

      <a href="/quiz" className={styles.backLink}>← Back to Quiz</a>

      {metrics && (
        <>
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.big}>{metrics.totalScore}</div>
              <div className={styles.label}>Total Score</div>
            </div>
            <div className={styles.card}>
              <div className={styles.big}>
                {metrics.accuracy ? `${(metrics.accuracy*100).toFixed(1)}%` : 'N/A'}
              </div>
              <div className={styles.label}>Accuracy</div>
            </div>
            <div className={styles.card}>
              <div className={styles.big}>{metrics.maxStreak}</div>
              <div className={styles.label}>Best Streak</div>
            </div>
            <div className={styles.card}>
              <div className={styles.big}>{metrics.totalQuestions}</div>
              <div className={styles.label}>Questions</div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Performance Details</div>
            <div className={styles.detailsGrid}>
              <div>Correct Answers: {metrics.correctAnswers}</div>
              <div>Current Streak: {metrics.currentStreak}</div>
              <div>Average Difficulty: {metrics.averageDifficulty || 'N/A'}</div>
              <div>Highest Difficulty: {metrics.highestDifficulty || 'N/A'}</div>
              <div>Recent Performance: {metrics.recentPerformance ? `${(metrics.recentPerformance*100).toFixed(0)}%` : 'N/A'}</div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Difficulty Distribution</div>
            {Object.entries(metrics.difficultyDistribution || {}).map(([level,count]) => (
              <div key={level} className={styles.barRow}>
                <div className={styles.barLabel}>Level {level}</div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: maxValue ? `${(count/maxValue)*100}%` : '0%' }}
                  />
                </div>
                <div className={styles.barValue}>{count}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
