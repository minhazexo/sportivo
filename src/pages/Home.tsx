import { useEffect, useState, useRef } from 'react';
import { getScores, getFixtures, getStandings, getSportsNews, getWorldCupNews, LEAGUE_IDS } from '../lib/sportsApi';
import type { Match, Standing, Article } from '../lib/sportsApi';
import ScoreWidget from '../components/scores/ScoreWidget';
import ArticleCard from '../components/news/ArticleCard';
import SportsNewsCard from '../components/news/SportsNewsCard';
import AdPromo from '../components/ads/AdPromo';
import OptimizedImage from '../components/news/OptimizedImage';
import { ArticleCardSkeleton, ScoreWidgetSkeleton, TableSkeleton } from '../components/news/Skeleton';
import SEO, { generateOrganizationJsonLd } from '../components/SEO';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, ArrowRight, Calendar, Trophy, Clock, Newspaper, ChevronRight, ExternalLink, BarChart3, Star, Users, Timer, Eye, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../lib/apiClient';

// ─── Hero Section ───────────────────────────────────────────────────────────

function HeroSection({ articles, loading }: { articles: Article[]; loading: boolean }) {
  const heroArticle = articles[0];
  const sideArticles = articles.slice(1, 4);

  if (loading) {
    return (
      <div className="hero-grid grid grid-cols-1 lg:grid-cols-3 gap-1 lg:gap-2 mb-8">
        <div className="lg:col-span-2 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-sm min-h-[400px]" />
        <div className="hidden lg:flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-800 animate-pulse rounded-sm h-[132px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!heroArticle) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800/50 rounded-sm p-12 text-center mb-8 border border-gray-200 dark:border-gray-700">
        <Newspaper className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 font-semibold text-sm">No featured stories available. Check back soon!</p>
      </div>
    );
  }

  return (
    <section className="mb-8">
      <div className="hero-grid grid grid-cols-1 lg:grid-cols-3 gap-1 lg:gap-2">
        {/* Main Hero */}
        <Link
          to={`/article/${heroArticle.slug}`}
          className="hero-main lg:col-span-2 relative overflow-hidden bg-gray-900 group cursor-pointer block min-h-[300px] lg:min-h-[420px]"
        >
          {/* Background Image */}
          {heroArticle.thumbnail ? (
            <img
              src={heroArticle.thumbnail}
              alt={heroArticle.title}
              className="absolute inset-0 w-full h-full object-cover card-img-zoom"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-accent/80 to-accent-dark/80 flex items-center justify-center">
              <Trophy className="w-16 h-16 text-white/40" />
            </div>
          )}

          {/* Dark overlay */}
          <div className="hero-gradient absolute inset-0 z-10" />

          {/* Category badge */}
          <div className="absolute top-4 left-4 z-20">
            <span className="inline-block bg-accent text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5">
              {heroArticle.category || 'Featured'}
            </span>
          </div>

          {/* Text content */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-5 lg:p-8">
            <h1 className="text-white text-xl lg:text-3xl font-extrabold leading-tight mb-2 lg:mb-3 line-clamp-3 group-hover:text-accent-light transition-colors">
              {heroArticle.title}
            </h1>
            <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 mb-3 hidden lg:block">
              {heroArticle.excerpt}
            </p>
            <div className="flex items-center gap-3 text-gray-400 text-[11px] font-medium">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {heroArticle.authorName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {heroArticle.views || 0} views
              </span>
              <span className="ml-auto flex items-center gap-1 text-accent-light text-[10px] font-bold uppercase">
                Read Story <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </Link>

        {/* Side Stories */}
        <div className="hidden lg:flex flex-col gap-2">
          {sideArticles.length > 0 ? (
            sideArticles.map((article, idx) => (
              <Link
                key={article.id || idx}
                to={`/article/${article.slug}`}
                className="relative overflow-hidden bg-gray-900 group cursor-pointer block flex-1 min-h-0"
              >
                {article.thumbnail ? (
                  <img
                    src={article.thumbnail}
                    alt={article.title}
                    className="absolute inset-0 w-full h-full object-cover card-img-zoom"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
                )}
                <div className="secondary-gradient absolute inset-0 z-10" />
                <div className="absolute top-3 left-3 z-20">
                  <span className="inline-block bg-accent text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
                    {article.category || 'News'}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 z-20 p-3">
                  <h3 className="text-white text-sm font-bold leading-tight line-clamp-2 group-hover:text-accent-light transition-colors">
                    {article.title}
                  </h3>
                  <span className="text-gray-400 text-[10px] font-medium mt-1 block">
                    {article.authorName}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            [1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-sm flex-1" />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Quick Links Bar ────────────────────────────────────────────────────────

const QUICK_LINKS = [
  { label: 'Premier League', icon: Trophy, href: '/leagues' },
  { label: 'Champions League', icon: Star, href: '/leagues' },
  { label: 'NBA', icon: Trophy, href: '/leagues' },
  { label: 'La Liga', icon: Trophy, href: '/leagues' },
  { label: 'Standings', icon: BarChart3, href: '/standings' },
  { label: 'Fixtures', icon: Calendar, href: '/fixtures' },
];

function QuickLinks() {
  return (
    <div className="hidden lg:flex items-center gap-1 mb-6 overflow-x-auto no-scrollbar">
      {QUICK_LINKS.map((link) => (
        <Link
          key={link.label}
          to={link.href}
          className="flex items-center gap-1.5 px-4 py-2 border transition-all text-[11px] font-bold uppercase tracking-wider whitespace-nowrap rounded-sm"
          style={{
            backgroundColor: 'var(--color-card-bg)',
            borderColor: 'var(--color-border-primary)',
            color: 'var(--color-text-secondary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
            e.currentTarget.style.borderColor = 'var(--color-border-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-card-bg)';
            e.currentTarget.style.borderColor = 'var(--color-border-primary)';
          }}
        >
          <link.icon className="w-3.5 h-3.5 text-accent" />
          {link.label}
        </Link>
      ))}
    </div>
  );
}

// ─── Score Ticker ───────────────────────────────────────────────────────────

function ScoreTicker({ matches }: { matches: Match[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (matches.length === 0) return null;

  return (
    <div className="score-ticker-gradient border-b border-gray-700/50 dark:border-gray-700/30 mb-6">
      <div className="flex items-center max-w-full">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-accent shrink-0 z-10">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span className="text-white text-[10px] font-bold uppercase tracking-wider">LIVE</span>
        </div>
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto no-scrollbar"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="flex gap-0 w-max">
            {matches.map((match) => (
              <Link
                key={match.idEvent}
                to={`/match/${match.idEvent}`}
                className="flex items-center gap-3 px-5 py-2.5 border-r border-gray-700/30 hover:bg-white/5 transition-colors shrink-0 group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-gray-300 text-[12px] font-bold whitespace-nowrap">{match.strHomeTeam?.substring(0, 10) || 'Home'}</span>
                  <span className="text-white text-[14px] font-extrabold min-w-[20px] text-center">{match.intHomeScore ?? '-'}</span>
                  <span className="text-gray-500 text-[10px] font-medium">vs</span>
                  <span className="text-white text-[14px] font-extrabold min-w-[20px] text-center">{match.intAwayScore ?? '-'}</span>
                  <span className="text-gray-300 text-[12px] font-bold whitespace-nowrap">{match.strAwayTeam?.substring(0, 10) || 'Away'}</span>
                </div>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm ${
                  match.strStatus === 'Live' || match.strStatus === 'In Progress'
                    ? 'bg-red-600/20 text-red-400'
                    : 'bg-gray-700/50 text-gray-400'
                }`}>
                  {match.strStatus === 'Live' || match.strStatus === 'In Progress' ? 'LIVE' : match.strStatus || 'FT'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FIFA World Cup Section ────────────────────────────────────────────────

function WorldCupSection({ articles }: { articles: any[] }) {
  if (articles.length === 0) return null;

  const featured = articles[0];
  const rest = articles.slice(1, 7);

  return (
    <section className="mb-10">
      <div
        className="relative overflow-hidden rounded-sm mb-5"
        style={{
          background: 'linear-gradient(135deg, #0a1628 0%, #1a1a3e 50%, #0a1628 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-5 right-5 w-24 h-24 border-2 border-white/20 rounded-full" />
          <div className="absolute bottom-5 left-5 w-16 h-16 border-2 border-white/10 rounded-full" />
        </div>
        <div className="relative z-10 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-lg font-extrabold text-white leading-tight">FIFA World Cup 2026</h2>
              <p className="text-yellow-400/80 text-[10px] font-bold uppercase tracking-wider">Trending News & Updates</p>
            </div>
          </div>
          <Link
            to="/world-cup"
            className="flex items-center gap-1.5 px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-accent text-white text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all"
          >
            World Cup Hub <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Featured Article */}
      <a
        href={featured.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block overflow-hidden rounded-sm border mb-4 transition-all hover:shadow-md"
        style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border-primary)' }}
      >
        <div className="md:flex md:flex-row-reverse">
          <div className="md:w-2/5 relative overflow-hidden bg-gray-100 dark:bg-gray-800 min-h-[180px]">
            {featured.image ? (
              <img
                src={featured.image}
                alt={featured.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(37,99,235,0.05))' }}>
                <Trophy className="w-12 h-12 text-yellow-500/30" />
              </div>
            )}
            <div className="absolute top-2 left-2 z-10">
              <span className="inline-flex items-center gap-1 bg-accent text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm">
                <TrendingUp className="w-3 h-3" /> Top World Cup
              </span>
            </div>
          </div>
          <div className="md:w-3/5 p-5 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              {featured.source}
            </span>
            <h3 className="text-base font-extrabold leading-tight group-hover:text-accent transition-colors mb-2 line-clamp-2 mt-1" style={{ color: 'var(--color-text-primary)' }}>
              {featured.title}
            </h3>
            <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
              {featured.description}
            </p>
          </div>
        </div>
      </a>

      {/* Rest of World Cup articles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {rest.map((article, idx) => (
          <motion.a
            key={article.url || idx}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group block overflow-hidden rounded-sm border transition-all hover:shadow-sm"
            style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border-primary)' }}
          >
            <div className="relative overflow-hidden aspect-[16/10]" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              {article.image ? (
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Globe className="w-6 h-6" style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
              )}
            </div>
            <div className="p-2.5">
              <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                {article.source}
              </span>
              <h4 className="text-[11px] font-bold leading-snug line-clamp-2 group-hover:text-accent transition-colors mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                {article.title}
              </h4>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}

// ─── Featured Content Grid ──────────────────────────────────────────────────

function FeaturedContent({ articles, sportsNews, loading }: { articles: Article[]; sportsNews: any[]; loading: boolean }) {
  const displayArticles = articles.slice(4, 10);
  const hasSportsNews = sportsNews.length > 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="espn-card animate-pulse">
            <div className="aspect-[16/9]" style={{ backgroundColor: 'var(--color-skeleton)' }} />
            <div className="p-4 space-y-3">
              <div className="h-3 w-16 rounded" style={{ backgroundColor: 'var(--color-skeleton)' }} />
              <div className="h-5 rounded w-full" style={{ backgroundColor: 'var(--color-skeleton)' }} />
              <div className="h-5 rounded w-3/4" style={{ backgroundColor: 'var(--color-skeleton)' }} />
              <div className="h-3 w-24 rounded" style={{ backgroundColor: 'var(--color-skeleton)' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (displayArticles.length === 0 && !hasSportsNews) return null;

  return (
    <section className="mb-10">
      <div className="section-header">
        <h2 className="text-xl lg:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-header-text)' }}>Top Stories</h2>
        <Link to="/search" className="ml-auto text-[11px] font-bold uppercase tracking-wider text-accent hover:text-accent-dark transition-colors flex items-center gap-1">
          View All <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {displayArticles.slice(0, 6).map((article, idx) => (
            <motion.div
              key={article.id || idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
            >
              <Link
                to={`/article/${article.slug}`}
                className="espn-card group block"
              >
                <div className="relative overflow-hidden aspect-[16/10]" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  {article.thumbnail ? (
                    <img
                      src={article.thumbnail}
                      alt={article.title}
                      className="w-full h-full object-cover card-img-zoom"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250"%3E%3Crect fill="%23334155" width="400" height="250"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="18" fill="%2364748B" font-family="system-ui"%3ESportivo%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, var(--color-bg-tertiary), var(--color-bg-secondary))' }}>
                      <Trophy className="w-10 h-10" style={{ color: 'var(--color-text-tertiary)' }} />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="espn-tag bg-accent text-white">
                      {article.category || 'News'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="espn-headline text-base mb-2 group-hover:text-accent transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-[12px] leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                    <span>{article.authorName}</span>
                    <span>{new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Sports News from external API */}
      {hasSportsNews && (
        <div className="mt-10">
          <div className="section-header">
            <h2 className="text-xl lg:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-header-text)' }}>
              <span className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-accent" />
                Around the Sports World
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sportsNews.slice(0, 8).map((article, idx) => (
              <motion.a
                key={article.url}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}                    className="espn-card group block"
              >
                <div className="relative overflow-hidden aspect-[16/9]" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  {article.image ? (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover card-img-zoom"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, var(--color-bg-tertiary), var(--color-bg-secondary))' }}>
                      <Newspaper className="w-8 h-8" style={{ color: 'var(--color-text-tertiary)' }} />
                    </div>
                  )}
                </div>
                <div className="p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="espn-tag text-[9px]" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                      {article.source || 'Sports'}
                    </span>
                    <ExternalLink className="w-2.5 h-2.5 ml-auto" style={{ color: 'var(--color-text-tertiary)' }} />
                  </div>
                  <h3 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-accent transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                    {article.title}
                  </h3>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Results & Fixtures ─────────────────────────────────────────────────────

function ResultsFixtures({ matches, fixtures, matchesLoading, fixturesLoading }: {
  matches: Match[];
  fixtures: Match[];
  matchesLoading: boolean;
  fixturesLoading: boolean;
}) {
  if (matches.length === 0 && fixtures.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Results */}
        {matches.length > 0 && (
          <div>
            <div className="section-header">
              <Trophy className="w-4 h-4 text-accent" />
              <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--color-header-text)' }}>Recent Results</h2>
              <Link to="/fixtures" className="ml-auto text-[10px] font-bold uppercase tracking-wider text-accent hover:text-accent-dark">
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {matchesLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="p-3 animate-pulse" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border-primary)' }}>
                    <div className="h-4 animate-pulse rounded w-3/4 mb-2" style={{ backgroundColor: 'var(--color-skeleton)' }} />
                    <div className="h-4 animate-pulse rounded w-1/2" style={{ backgroundColor: 'var(--color-skeleton)' }} />
                  </div>
                ))
              ) : (
                matches.slice(0, 5).map((match) => (
                  <Link
                    key={match.idEvent}
                    to={`/match/${match.idEvent}`}
                    className="group block p-3 border transition-all"
                    style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border-primary)' }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                        {match.strStatus === 'FT' || match.strStatus === 'Match Finished' ? 'Full Time' : match.strStatus}
                      </span>
                      {match.dateEvent && (
                        <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                          {new Date(match.dateEvent).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold group-hover:text-accent transition-colors flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                        {match.strHomeTeam}
                      </span>
                      <span className="text-base font-extrabold min-w-[30px] text-center" style={{ color: 'var(--color-text-primary)' }}>{match.intHomeScore ?? '-'}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-bold group-hover:text-accent transition-colors flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                        {match.strAwayTeam}
                      </span>
                      <span className="text-base font-extrabold min-w-[30px] text-center" style={{ color: 'var(--color-text-primary)' }}>{match.intAwayScore ?? '-'}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {/* Upcoming Fixtures */}
        {fixtures.length > 0 && (
          <div>
            <div className="section-header">
              <Calendar className="w-4 h-4 text-accent" />
              <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--color-header-text)' }}>Upcoming Fixtures</h2>
              <Link to="/fixtures" className="ml-auto text-[10px] font-bold uppercase tracking-wider text-accent hover:text-accent-dark">
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {fixturesLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="p-3 animate-pulse" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border-primary)' }}>
                    <div className="h-4 animate-pulse rounded w-3/4 mb-2" style={{ backgroundColor: 'var(--color-skeleton)' }} />
                    <div className="h-4 animate-pulse rounded w-1/2" style={{ backgroundColor: 'var(--color-skeleton)' }} />
                  </div>
                ))
              ) : (
                fixtures.slice(0, 5).map((fixture) => (
                  <Link
                    key={fixture.idEvent}
                    to={`/match/${fixture.idEvent}`}
                    className="group block p-3 border transition-all"
                    style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border-primary)' }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-accent">
                        {fixture.strLeague || 'Premier League'}
                      </span>
                      {fixture.dateEvent && (
                        <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
                          <Calendar className="w-3 h-3" />
                          {new Date(fixture.dateEvent).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold group-hover:text-accent transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                          {fixture.strHomeTeam}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-tertiary)' }}>
                          {fixture.strTime || 'TBD'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold group-hover:text-accent transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                          {fixture.strAwayTeam}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-tertiary)' }}>
                          {fixture.strTime || 'TBD'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────────────

function SidebarStandings({ standings, standingsLoading }: { standings: Standing[]; standingsLoading: boolean }) {
  return (
    <div>
      <div className="section-header">
        <BarChart3 className="w-4 h-4 text-accent" />
        <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Standings</h2>
        <Link to="/standings" className="ml-auto text-[10px] font-bold uppercase tracking-wider text-accent hover:text-accent-dark">
          Full Table
        </Link>
      </div>

      {standingsLoading ? (
        <TableSkeleton rows={6} />
      ) : standings.length > 0 ? (
        <div className="rounded-sm overflow-hidden" style={{ backgroundColor: 'var(--color-standings-bg)', border: '1px solid var(--color-border-primary)' }}>
          {/* Header */}
          <div className="grid grid-cols-12 gap-1 px-3 py-2 border-b" style={{ backgroundColor: 'var(--color-standings-row)', borderColor: 'var(--color-border-primary)' }}>
            <span className="col-span-1 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>#</span>
            <span className="col-span-6 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Team</span>
            <span className="col-span-1 text-[9px] font-bold uppercase tracking-wider text-center" style={{ color: 'var(--color-text-tertiary)' }}>P</span>
            <span className="col-span-2 text-[9px] font-bold uppercase tracking-wider text-center" style={{ color: 'var(--color-text-tertiary)' }}>GD</span>
            <span className="col-span-2 text-[9px] font-bold uppercase tracking-wider text-center" style={{ color: 'var(--color-text-tertiary)' }}>Pts</span>
          </div>

          {/* Rows */}
          {standings.slice(0, 10).map((team, idx) => {
            const gd = parseInt(team.intGoalDifference);
            const isTop4 = idx < 4;
            const isRelegation = idx >= standings.length - 3;

            return (
              <div
                key={team.idStanding}
                className="grid grid-cols-12 gap-1 px-3 py-2.5 last:border-0 transition-colors items-center"
                style={{ borderBottom: '1px solid var(--color-border-primary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span className={`col-span-1 text-[12px] font-bold text-center ${
                  isTop4 ? 'text-accent' : isRelegation ? 'text-red-500' : 'text-gray-400'
                }`}>
                  {team.intRank}
                </span>
                <div className="col-span-6 flex items-center gap-2 min-w-0">
                  {team.strTeamBadge && (
                    <img
                      src={team.strTeamBadge}
                      alt=""
                      className="w-4 h-4 object-contain shrink-0"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[12px] font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{team.strTeam}</span>
                    {team.strTeamShort && (
                      <span className="text-[9px] hidden lg:inline" style={{ color: 'var(--color-text-tertiary)' }}>{team.strTeamShort}</span>
                    )}
                  </div>
                </div>
                <span className="col-span-1 text-[12px] font-semibold text-center" style={{ color: 'var(--color-text-secondary)' }}>{team.intPlayed}</span>
                <span className={`col-span-2 text-[12px] font-bold text-center ${
                  gd > 0 ? 'text-green-600' : gd < 0 ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {gd > 0 ? '+' : ''}{gd}
                </span>
                <span className="col-span-2 text-[13px] font-extrabold text-center" style={{ color: 'var(--color-text-primary)' }}>{team.intPoints}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-sm p-6 text-center" style={{ backgroundColor: 'var(--color-standings-bg)', border: '1px solid var(--color-border-primary)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No standings available</p>
        </div>
      )}

      {/* Ad / Promo Box */}
      <div className="mt-6 bg-gradient-to-br from-espn-dark to-gray-900 p-6 rounded-sm">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-accent mb-2">Sportivo Premium</h3>
        <p className="text-gray-400 text-[12px] leading-relaxed mb-4">
          Get ad-free access, insider analysis, and in-depth match coverage.
        </p>
        <button className="w-full py-2.5 bg-accent text-white text-[10px] font-bold uppercase tracking-wider hover:bg-accent-dark transition-colors rounded-sm">
          Subscribe Now
        </button>
      </div>
    </div>
  );
}

// ─── Main Home Component ────────────────────────────────────────────────────

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [fixturesLoading, setFixturesLoading] = useState(true);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [sportsNews, setSportsNews] = useState<any[]>([]);
  const [sportsNewsLoading, setSportsNewsLoading] = useState(true);
  const [worldCupNews, setWorldCupNews] = useState<any[]>([]);
  const [worldCupLoading, setWorldCupLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const data = await apiClient.get('/articles?status=published');
        const fetchedArticles = data || [];
        setArticles(fetchedArticles);
      } catch (err) {
        console.error("Error fetching articles:", err);
        setError("Failed to load articles. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, []);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const data = await getScores(LEAGUE_IDS.PREMIER_LEAGUE);
        if (data.events && data.events.length > 0) {
          setMatches(data.events);
        }
      } catch (error) {
        console.error("Scores fetch error:", error);
      } finally {
        setMatchesLoading(false);
      }
    }
    fetchMatches();
  }, []);

  useEffect(() => {
    async function fetchFixtures() {
      try {
        const data = await getFixtures(LEAGUE_IDS.PREMIER_LEAGUE);
        if (data.events && data.events.length > 0) {
          setFixtures(data.events);
        }
      } catch (error) {
        console.error("Fixtures fetch error:", error);
      } finally {
        setFixturesLoading(false);
      }
    }
    fetchFixtures();
  }, []);

  useEffect(() => {
    async function fetchStandings() {
      try {
        const data = await getStandings(LEAGUE_IDS.PREMIER_LEAGUE);
        if (data.table && data.table.length > 0) {
          setStandings(data.table);
        }
      } catch (error) {
        console.error("Standings fetch error:", error);
      } finally {
        setStandingsLoading(false);
      }
    }
    fetchStandings();
  }, []);

  useEffect(() => {
    async function fetchSportsNews() {
      try {
        const data = await getSportsNews('sports', 12);
        if (data.articles && data.articles.length > 0) {
          setSportsNews(data.articles);
        }
      } catch (error) {
        console.error("Sports news fetch error:", error);
      } finally {
        setSportsNewsLoading(false);
      }
    }
    fetchSportsNews();
  }, []);

  useEffect(() => {
    async function fetchWorldCupNews() {
      try {
        const data = await getWorldCupNews(8);
        if (data?.articles) {
          setWorldCupNews(data.articles);
        }
      } catch (error) {
        console.error("World Cup news fetch error:", error);
      } finally {
        setWorldCupLoading(false);
      }
    }
    fetchWorldCupNews();
  }, []);

  const latestUpdates = articles.slice(0, 5);

  return (
    <>
      <SEO
        title="Home"
        description="Your premium source for sports news, live scores, and in-depth analysis across football, basketball, cricket, tennis, and more."
        jsonLd={generateOrganizationJsonLd()}
      />

      {/* Score Ticker (ESPN-style horizontal scrolling ticker) */}
      <ScoreTicker matches={matches} />

      {/* Quick Links Navigation */}
      <QuickLinks />

      {/* Hero Section */}
      <HeroSection articles={articles} loading={loading} />

      {/* Main Content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content (3/4 width) */}
        <div className="lg:col-span-3">
          {/* Error Banner */}
          {error && (
            <div className="border-l-4 border-red-500 p-4 mb-6" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Featured Content Grid */}
          <FeaturedContent articles={articles} sportsNews={sportsNews} loading={loading} />

          {/* FIFA World Cup Section */}
          {!worldCupLoading && <WorldCupSection articles={worldCupNews} />}

          {/* Ad placement between Featured Content and Results & Fixtures */}
          <AdPromo size="leaderboard" id="home-content-banner" className="my-8" />

          {/* Results & Fixtures */}
          <ResultsFixtures
            matches={matches}
            fixtures={fixtures}
            matchesLoading={matchesLoading}
            fixturesLoading={fixturesLoading}
          />
        </div>

        {/* Sidebar (1/4 width) */}
        <aside className="lg:col-span-1">
          {/* Latest Updates */}
          <div className="mb-8">
            <div className="section-header">
              <Timer className="w-4 h-4 text-accent" />
              <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Latest</h2>
            </div>
            <div className="space-y-0">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="py-3 last:border-0" style={{ borderBottom: i < 4 ? '1px solid var(--color-border-primary)' : 'none' }}>
                    <div className="h-3 w-16 animate-pulse rounded mb-2" style={{ backgroundColor: 'var(--color-skeleton)' }} />
                    <div className="h-4 w-full animate-pulse rounded mb-1" style={{ backgroundColor: 'var(--color-skeleton)' }} />
                    <div className="h-3 w-20 animate-pulse rounded" style={{ backgroundColor: 'var(--color-skeleton)' }} />
                  </div>
                ))
              ) : latestUpdates.length > 0 ? (
                latestUpdates.map((article, i) => (
                  <Link
                    key={article.id}
                    to={`/article/${article.slug}`}
                    className="block py-3 group cursor-pointer -mx-3 px-3 rounded-sm transition-colors"
                    style={{
                      ...(i < latestUpdates.length - 1 ? { borderBottom: '1px solid var(--color-border-primary)' } : {}),
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1 block">
                      {article.category || 'News'}
                    </span>
                    <p className="text-[13px] font-bold leading-snug group-hover:text-accent transition-colors line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
                      {article.title}
                    </p>
                    <span className="text-[10px] font-medium mt-1 block" style={{ color: 'var(--color-text-tertiary)' }}>
                      {article.authorName} • {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No updates available</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Ad */}
          <div className="mb-8">
            <AdPromo size="rectangle" id="home-sidebar-ad" variant="dark" />
          </div>

          {/* Standings */}
          <SidebarStandings standings={standings} standingsLoading={standingsLoading} />
        </aside>
      </div>
    </>
  );
}
