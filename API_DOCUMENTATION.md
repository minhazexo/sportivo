# Sportivo API Documentation

## Table of Contents

- [Project Overview](#project-overview)
- [Backend API Endpoints](#backend-api-endpoints)
- [Frontend Routes](#frontend-routes)
- [External APIs](#external-apis)
- [Firebase Services](#firebase-services)
- [Data Models](#data-models)
- [Authentication](#authentication)
- [Error Handling](#error-handling)

---

## Project Overview

**Sportivo** is a high-performance sports news platform built with:
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (Google OAuth)
- **AI**: Google Gemini API

---

## Backend API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Service health check |

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-17T12:00:00Z"
}
```

---

### AI Content Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate` | Generate AI content using Google Gemini |

**Request Body:**
```json
{
  "prompt": "Write a headline about Champions League final",
  "type": "headline" | "article" | "summary"
}
```

**Response:**
```json
{
  "content": "Generated content...",
  "model": "gemini-2.0-flash",
  "timestamp": "2026-05-17T12:00:00Z"
}
```

---

### Sports Data - Scores

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sports/scores` | Fetch live soccer scores |

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| league | string | League ID (e.g., `English_Premier_League`) |
| date | string | Date in YYYY-MM-DD format |

**Response:**
```json
{
  "matches": [
    {
      "idEvent": "12345",
      "strEvent": "Manchester United vs Liverpool",
      "strHomeTeam": "Manchester United",
      "strAwayTeam": "Liverpool",
      "intHomeScore": 2,
      "intAwayScore": 1,
      "strStatus": "Finished",
      "strDate": "2026-05-17",
      "strTime": "15:00:00",
      "strThumb": "https://..."
    }
  ]
}
```

---

### Sports Data - Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sports/teams/:league` | Fetch teams by league |

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| league | string | League ID |

**Response:**
```json
{
  "teams": [
    {
      "idTeam": "133604",
      "strTeam": "Manchester United",
      "strTeamShort": "MU",
      "strStadium": "Old Trafford",
      "strLocation": "Manchester, England",
      "strTeamBadge": "https://...",
      "strWebsite": "www.manutd.com",
      "strDescriptionEN": "Manchester United FC..."
    }
  ]
}
```

---

## Frontend Routes

### Public Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home | Main dashboard with scores, featured articles, breaking news |
| `/article/:slug` | ArticleDetail | Full article view with comments |
| `/leagues` | Leagues | Browse sports leagues (Premier League, La Liga, NBA, etc.) |
| `/teams` | Teams | Team directory with filtering |
| `/login` | Login | User login page |

### Protected Routes (Admin Only)

| Path | Component | Description |
|------|-----------|-------------|
| `/admin` | AdminDashboard | CMS dashboard |
| `/admin/articles/new` | ArticleEditor | Create new article |
| `/admin/articles/edit/:id` | ArticleEditor | Edit existing article |

---

## External APIs

### TheSportsDB (Free Sports Data)

**Base URL:** `https://www.thesportsdb.com/api/v1/json/3`

**Endpoints Used:**

| Endpoint | Description |
|----------|-------------|
| `/eventsnext.php?id={leagueId}` | Upcoming matches |
| `/eventspast.php?id={leagueId}` | Past matches |
| `/lookup_all_teams.php?id={leagueId}` | All teams in league |
| `/lookupteam.php?id={teamId}` | Team details |
| `/searchteams.php?t={query}` | Search teams |

**League IDs:**
| League | ID |
|--------|-----|
| English Premier League | 4328 |
| Spanish La Liga | 4335 |
| German Bundesliga | 4331 |
| Italian Serie A | 4332 |
| French Ligue 1 | 4334 |
| NBA | 4387 |
| F1 | 4619 |

---

### Google Gemini API

**Model:** `gemini-2.0-flash`

**Purpose:** AI content generation for articles, headlines, and summaries

**Request Format:**
```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Your prompt here"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.9,
    "maxOutputTokens": 2048
  }
}
```

---

## Firebase Services

### Firebase Authentication

**Provider:** Google OAuth

**Supported Methods:**
- Google Sign-In Popup
- Email/Password (future)

**User Data Structure:**
```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'user';
  createdAt: Timestamp;
  lastLogin: Timestamp;
}
```

---

### Firebase Firestore

**Database ID:** `ai-studio-bb7a3316-7e88-4578-a794-8050beac546b`

#### Collections

**users**
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'user';
  createdAt: Timestamp;
  lastLogin: Timestamp;
}
```

**articles**
```typescript
{
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Markdown
  coverImage: string;
  authorId: string;
  authorName: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  publishedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  views: number;
}
```

**comments**
```typescript
{
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  content: string;
  createdAt: Timestamp;
}
```

**matches**
```typescript
{
  id: string;
  leagueId: string;
  leagueName: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  date: Timestamp;
  createdAt: Timestamp;
}
```

**analytics**
```typescript
{
  id: string;
  type: 'view' | 'click' | 'share';
  articleId?: string;
  userId?: string;
  metadata: Record<string, any>;
  createdAt: Timestamp;
}
```

---

## Data Models

### Article

```typescript
interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  publishedAt: Date | null;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Match

```typescript
interface Match {
  id: string;
  leagueId: string;
  leagueName: string;
  homeTeam: {
    id: string;
    name: string;
    logo: string;
    score: number;
  };
  awayTeam: {
    id: string;
    name: string;
    logo: string;
    score: number;
  };
  status: 'scheduled' | 'live' | 'finished';
  date: Date;
  time: string;
  venue: string;
}
```

### Team

```typescript
interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  league: string;
  stadium: string;
  location: string;
  website: string;
  description: string;
}
```

### User

```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'user';
  createdAt: Date;
}
```

### Comment

```typescript
interface Comment {
  id: string;
  articleId: string;
  user: {
    id: string;
    name: string;
    photo: string;
  };
  content: string;
  createdAt: Date;
}
```

---

## Authentication

### Flow

1. User clicks "Sign in with Google"
2. Firebase Auth popup opens
3. User authenticates with Google
4. On success, user data stored in Firestore `users` collection
5. JWT token returned for session management

### Role-Based Access

| Role | Permissions |
|------|-------------|
| `user` | Read articles, post comments, like content |
| `admin` | All user permissions + create/edit/delete articles, access admin dashboard |

### Protected Routes

- `/admin/*` - Requires `admin` role
- POST `/api/articles` - Requires authentication
- PUT `/api/articles/:id` - Requires authentication
- DELETE `/api/articles/:id` - Requires `admin` role

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid input data |
| `EXTERNAL_API_ERROR` | Third-party API failure |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/api/ai/generate` | 10 requests/minute |
| `/api/sports/*` | 60 requests/minute |
| Firestore reads | 50,000/day (free tier) |
| Firestore writes | 20,000/day (free tier) |

---

## Environment Variables

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Google Gemini
GEMINI_API_KEY=

# TheSportsDB (Free - no key required)
# Base URL: https://www.thesportsdb.com/api/v1/json/3
```

---

## Development

### Running the Project

```bash
# Install dependencies
npm install

# Start development server (frontend)
npm run dev

# Start backend server
npm run server

# Build for production
npm run build
```

### API Testing

Use tools like Postman or curl to test endpoints:

```bash
# Health check
curl http://localhost:5173/api/health

# Get scores
curl http://localhost:5173/api/sports/scores?league=English_Premier_League

# Generate AI content
curl -X POST http://localhost:5173/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write about football", "type": "headline"}'
```

---

## Security

- All admin routes protected by Firestore security rules
- API endpoints validate authentication tokens
- Input sanitization on all user-generated content
- Rate limiting on external API calls
- CORS configured for trusted domains only

See [security_spec.md](./security_spec.md) for detailed security specifications.