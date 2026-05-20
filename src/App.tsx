/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import Leagues from './pages/Leagues';
import Teams from './pages/Teams';
import Search from './pages/Search';
import Tags from './pages/Tags';
import TagArticles from './pages/TagArticles';
import Fixtures from './pages/Fixtures';
import Standings from './pages/Standings';
import TeamDetail from './pages/TeamDetail';
import MatchDetail from './pages/MatchDetail';
import Bookmarks from './pages/Bookmarks';
import WorldCup from './pages/WorldCup';
import NotificationPreferences from './pages/NotificationPreferences';
import AdminDashboard from './pages/admin/AdminDashboard';
import ArticleEditor from './pages/admin/ArticleEditor';
import UserManagement from './pages/admin/UserManagement';
import AdManagement from './pages/admin/AdManagement';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import AdminSettings from './pages/admin/AdminSettings';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Analytics from './components/analytics/Analytics';

export default function App() {
  const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

  return (
    <>
      <Analytics measurementId={GA_MEASUREMENT_ID} />
      <AuthProvider>
        <NotificationProvider>
          <ToastProvider>
            <Router>
              <div className="min-h-screen font-sans" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/article/:slug" element={<ArticleDetail />} />
                    <Route path="/leagues" element={<Leagues />} />
                    <Route path="/fixtures" element={<Fixtures />} />
                    <Route path="/leagues/:id/fixtures" element={<Fixtures />} />
                    <Route path="/leagues/:id/standings" element={<Standings />} />
                    <Route path="/standings" element={<Standings />} />
                    <Route path="/teams" element={<Teams />} />
                    <Route path="/team/:id" element={<TeamDetail />} />
                    <Route path="/match/:id" element={<MatchDetail />} />
                    <Route path="/world-cup" element={<WorldCup />} />
                    <Route path="/bookmarks" element={<Bookmarks />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/tags" element={<Tags />} />
                    <Route path="/tag/:tag" element={<TagArticles />} />
                    <Route path="/notifications/preferences" element={<NotificationPreferences />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/articles/new" element={<ArticleEditor />} />
                    <Route path="/admin/articles/edit/:id" element={<ArticleEditor />} />
                    <Route path="/admin/users" element={<UserManagement />} />
                    <Route path="/admin/ads" element={<AdManagement />} />
                    <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </Router>
          </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </>
  );
}

