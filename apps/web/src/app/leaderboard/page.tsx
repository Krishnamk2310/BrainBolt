'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import socketClient from '@/lib/socket';
import styles from './leaderboard.module.css';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  value: number;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'score' | 'streak'>('score');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();

    socketClient.connect();
    socketClient.onLeaderboardUpdate(fetchLeaderboard);

    return () => socketClient.offLeaderboardUpdate();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const userId = localStorage.getItem('brainbolt_userId');
    const response =
      activeTab === 'score'
        ? await api.getScoreLeaderboard(50, userId || undefined)
        : await api.getStreakLeaderboard(50, userId || undefined);

    if (response.success && response.data) setEntries(response.data);
    setLoading(false);
  };

  const currentUserId =
    typeof window !== 'undefined'
      ? localStorage.getItem('brainbolt_userId')
      : null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Leaderboard</h1>
        <p className={styles.subtitle}>Top performers in BrainBolt</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tabButton} ${activeTab === 'score' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('score')}
        >
          By Score
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'streak' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('streak')}
        >
          By Streak
        </button>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th style={{ textAlign: 'right' }}>
                  {activeTab === 'score' ? 'Score' : 'Max Streak'}
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.userId}
                  className={entry.userId === currentUserId ? styles.highlight : ''}
                >
                  <td>
                    <span
                      className={`${styles.rankBadge} ${
                        entry.rank === 1
                          ? styles.rank1
                          : entry.rank === 2
                          ? styles.rank2
                          : entry.rank === 3
                          ? styles.rank3
                          : ''
                      }`}
                    >
                      {entry.rank}
                    </span>
                  </td>
                  <td>{entry.username}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {activeTab === 'score'
                      ? entry.value.toLocaleString()
                      : `${entry.value} 🔥`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <a href="/quiz" className={styles.playLink}>
        Play Now
      </a>
    </div>
  );
}
