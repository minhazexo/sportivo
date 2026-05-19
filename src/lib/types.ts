// Unified API and Data types used across Sportivo (Frontend & Backend)

export type ApiResponse<T> = T | { error?: string; [k: string]: any };

export interface Match {
  idEvent?: string;
  strEvent?: string;
  dateEvent?: string;
  strTime?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | number | null;
  intAwayScore?: string | number | null;
  strStatus?: string;
  strThumb?: string;
  [k: string]: any;
}

export interface Team {
  idTeam?: string;
  strTeam?: string;
  strTeamShort?: string;
  strTeamBadge?: string | null;
  strStadium?: string | null;
  strLocation?: string;
  strWebsite?: string;
  strDescriptionEN?: string;
  intFormedYear?: string | null;
  [k: string]: any;
}

export interface Standing {
  table?: Array<Record<string, any>>;
  [k: string]: any;
}

export interface NewsArticle {
  id?: string;
  title: string;
  description: string;
  content: string;
  image: string;
  url: string;
  source: string;
  publishedAt: string;
}

export interface NewsResponse {
  status: string;
  totalArticles: number;
  articles: NewsArticle[];
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'user';
  createdAt: any;
  lastLogin: any;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  thumbnail: string;
  authorId: string;
  authorName: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt: any | null;
  createdAt: any;
  updatedAt: any;
  views: number;
  statusText?: string;
}

export interface Comment {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  content: string;
  createdAt: any;
}

export interface GeminiResponse {
  text: string;
}
