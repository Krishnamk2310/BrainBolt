# BrainBolt - Adaptive Infinite Quiz Platform

A production-grade adaptive quiz platform that serves one question at a time with continuously adapting difficulty based on user performance.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BRAINBOLT ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│   │              │     │              │     │              │   │
│   │   Web App   │────▶│    API      │────▶│  PostgreSQL  │   │
│   │  (Next.js)  │◀────│  (Express)  │◀────│   Database   │   │
│   │              │     │              │     │              │   │
│   └──────────────┘     └──────┬───────┘     └──────────────┘   │
│           │                   │                                  │
│           │           ┌──────▼───────┐                          │
│           │           │              │                          │
│           └──────────▶│    Redis     │◀─────────────────┐      │
│                       │   (Cache)   │                   │      │
│                       └─────────────┘                   │      │
│                                                         │      │
│                                    ┌────────────────────▼────┐ │
│                                    │                        │ │
│                                    │   Socket.io            │ │
│                                    │   (Real-time)         │ │
│                                    │                        │ │
│                                    └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Features

- **Adaptive Difficulty**: Questions automatically adjust based on your performance
- **Real-time Leaderboards**: See live rankings updated via Socket.io
- **Streak System**: Build multipliers with consecutive correct answers
- **Infinite Learning**: No end to the quiz - continuous improvement loop

## Adaptive Algorithm

### Difficulty Range
- Difficulty levels: **1 (Very Easy)** to **10 (Expert)**

### Confidence System
- Confidence range: **[-5, +5]**
- Correct answer: `confidence += 1.2 + (streak * 0.1)`
- Wrong answer: `confidence -= 1.5`

### Difficulty Change Rules
- Difficulty **increases** when confidence >= +3
- Difficulty **decreases** when confidence <= -3
- After change: `confidence = 0` (prevents oscillation)

### Streak System
- Correct → streak +1
- Wrong → streak = 0
- Inactivity > 2 min → streak decays by 50%
- Multiplier: `min(1 + (streak / 5), 3.5)`

### Score Formula
```
scoreDelta = difficulty * 10 * 1 * multiplier * (0.6 + recentPerformance)
```
Where:
- `difficulty`: Current difficulty level (1-10)
- `multiplier`: Streak multiplier (1x - 3.5x)
- `recentPerformance`: Last 5 answers accuracy (0-1)

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/auth/login` | Create or get user by username |

### Quiz
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/quiz/next` | Get next question and current state |
| POST | `/v1/quiz/answer` | Submit answer (idempotent) |
| GET | `/v1/quiz/state` | Get current user state |
| GET | `/v1/quiz/metrics` | Get user performance metrics |

### Leaderboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/leaderboard/score` | Top users by score |
| GET | `/v1/leaderboard/streak` | Top users by streak |

## Database Schema

### Tables

```sql
-- Users
users (id UUID, username VARCHAR, created_at TIMESTAMP)

-- Questions (200 seeded)
questions (id UUID, text TEXT, options TEXT[], correct_index INT, difficulty INT, category VARCHAR)

-- User State
user_state (user_id UUID, score INT, streak INT, max_streak INT, difficulty INT, confidence NUMERIC, multiplier NUMERIC, current_question_id UUID, state_version INT, last_activity_at TIMESTAMP)

-- Answer Log
answer_log (id UUID, user_id UUID, question_id UUID, selected_index INT, correct BOOLEAN, score_delta INT, difficulty INT, created_at TIMESTAMP)
```

### Indexes
- `user_state(user_id)` - User state lookup
- `leaderboard_score(total_score DESC)` - Score leaderboard
- `leaderboard_streak(max_streak DESC)` - Streak leaderboard
- `questions(difficulty)` - Question selection

## Running Locally

### Prerequisites
- Docker and Docker Compose

### Quick Start

```bash
# Clone the repository
cd brainbolt/infra

# Start all services
docker compose up --build

# Access the app
# Frontend: http://localhost:3000
# API: http://localhost:3001
```

### Manual Development

```bash
# Install dependencies
cd packages/shared-types && npm install && npm run build
cd packages/adaptive-engine && npm install && npm run build
cd apps/api && npm install
cd apps/web && npm install

# Start PostgreSQL and Redis (using Docker)
docker run -p 5432:5432 -e POSTGRES_USER=brainbolt -e POSTGRES_PASSWORD=brainbolt -e POSTGRES_DB=brainbolt postgres:15
docker run -p 6379:6379 redis:7

# Seed database
# Copy infra/init.sql to your postgres container

# Start API
cd apps/api && npm run dev

# Start Web
cd apps/web && npm run dev
```

## Edge Case Handling

| Scenario | Handling |
|----------|----------|
| Duplicate answer submission | Ignored (idempotency key) |
| Answer old question | Rejected (stateVersion mismatch) |
| Streak decay | 50% after 2 minutes inactivity |
| Difficulty bounds | Clamped between 1-10 |
| No questions at level | Falls back to nearest difficulty |

## Real-time Events

Socket.io events emitted:
- `user:update` - Score, streak, difficulty changes
- `leaderboard:update` - Leaderboard refresh
- `difficulty:update` - Difficulty change notification

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, Socket.io
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Infrastructure**: Docker, Docker Compose

## Project Structure

```
brainbolt/
├── apps/
│   ├── web/           # Next.js frontend
│   └── api/           # Express API server
├── packages/
│   ├── shared-types/   # Shared TypeScript types
│   └── adaptive-engine/ # Adaptive difficulty algorithm
├── infra/
│   ├── docker-compose.yml
│   └── init.sql       # Database schema & seed data
└── README.md
```

## Demo Steps

1. Open `http://localhost:3000`
2. Enter a username to login
3. Answer questions - difficulty adapts based on performance
4. Check `/leaderboard` for rankings
5. Check `/metrics` for your performance analytics

## License

MIT
