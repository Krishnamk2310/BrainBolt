'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import socketClient from '@/lib/socket';
import styles from './quiz.module.css';

export default function QuizPage() {
  const router = useRouter();
  const [question, setQuestion] = useState<any>(null);
  const [userState, setUserState] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [stateVersion, setStateVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('brainbolt_userId');
    if (!userId) return router.push('/login');

    api.setUserId(userId);
    socketClient.setUserId(userId);
    socketClient.connect();

    fetchQuestion();
  }, []);

  const fetchQuestion = async () => {
    setLoading(true);
    const res = await api.getNextQuestion();
    if (res.success) {
      setQuestion(res.data.question);
      setUserState(res.data.userState);
      setStateVersion(res.data.stateVersion);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (selectedIndex === null) return;
    setSubmitting(true);

    const res = await api.submitAnswer(
      question.id,
      selectedIndex,
      stateVersion,
      Date.now().toString()
    );

    if (res.success) {
      setResult(res.data.result);
      setUserState(res.data.userState);
      setTimeout(fetchQuestion, 2000);
    }

    setSubmitting(false);
  };

  if (loading) return <div className={styles.wrapper}>Loading...</div>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>BrainBolt</div>
          <div className={styles.subtitle}>
            Welcome, {localStorage.getItem('brainbolt_username')}
          </div>
        </div>
        <button className={styles.logout} onClick={()=>{
          localStorage.clear();
          router.push('/login');
        }}>Logout</button>
      </div>

      <div className={styles.stats}>
        <div><div className={styles.statValue}>{userState?.score}</div><div className={styles.statLabel}>Score</div></div>
        <div><div className={styles.statValue}>{userState?.streak}</div><div className={styles.statLabel}>Streak</div></div>
        <div><div className={styles.statValue}>{userState?.difficulty}</div><div className={styles.statLabel}>Difficulty</div></div>
        <div><div className={styles.statValue}>{userState?.multiplier}x</div><div className={styles.statLabel}>Multiplier</div></div>
      </div>

      {question && (
        <div className={styles.card}>
          <div className={styles.questionTitle}>{question.text}</div>

          {question.options.map((opt:string,i:number)=>(
            <button
              key={i}
              onClick={()=>setSelectedIndex(i)}
              className={`${styles.option} ${
                selectedIndex===i?styles.selected:''}
                ${result && i===question.correctIndex?styles.correct:''}
                ${result && selectedIndex===i && i!==question.correctIndex?styles.wrong:''}`
              }>
              {String.fromCharCode(65+i)}. {opt}
            </button>
          ))}

          {result && (
            <div className={`${styles.feedback} ${result.correct?styles.correctMsg:styles.wrongMsg}`}>
              {result.correct?`Correct! +${result.scoreDelta}`:'Wrong answer'}
            </div>
          )}

          <button
            className={styles.submit}
            disabled={selectedIndex===null || submitting}
            onClick={handleSubmit}>
            Submit Answer
          </button>
        </div>
      )}

      <div className={styles.nav}>
        <a href="/leaderboard" className={styles.link}>Leaderboard</a>
        |
        <a href="/metrics" className={styles.link}>Metrics</a>
      </div>
    </div>
  );
}
