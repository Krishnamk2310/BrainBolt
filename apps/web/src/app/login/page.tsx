'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import styles from './login.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedUserId = localStorage.getItem('brainbolt_userId');
    const storedUsername = localStorage.getItem('brainbolt_username');
    if (storedUserId && storedUsername) router.push('/quiz');
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (username.trim().length < 2) {
      setError('Username must be at least 2 characters');
      setLoading(false);
      return;
    }

    const response = await api.login(username.trim());

    if (response.success && response.data) {
      localStorage.setItem('brainbolt_userId', response.data.user.id);
      localStorage.setItem('brainbolt_username', response.data.user.username);
      router.push('/quiz');
    } else setError(response.error || 'Login failed');

    setLoading(false);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>BrainBolt</h1>
        <p className={styles.subtitle}>Adaptive Infinite Quiz Platform</p>

        <form onSubmit={handleLogin}>
          <label className={styles.label}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.input}
            placeholder="Enter your username"
            disabled={loading}
            autoFocus
          />

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Logging in...' : 'Start Quiz'}
          </button>
        </form>

        <a href="/leaderboard" className={styles.link}>
          View Leaderboard
        </a>
      </div>
    </div>
  );
}
