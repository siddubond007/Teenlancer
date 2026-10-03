import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import API from './services/api';

// --- Lazy Loaded Pages ---
const PostJobPage = lazy(() => import('./pages/PostJobPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentOrdersPage = lazy(() => import('./pages/StudentOrdersPage'));
const StudentGigsPage = lazy(() => import('./pages/StudentGigsPage'));
const StudentGigCreatePage = lazy(() => import('./pages/StudentGigCreatePage'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const OrderWorkspacePage = lazy(() => import('./pages/OrderWorkspacePage'));
const CategoryHubPage = lazy(() => import('./pages/CategoryHubPage'));
const HireCategoryPage = lazy(() => import('./pages/HireCategoryPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const SkillSearchPage = lazy(() => import('./pages/SkillSearchPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ClientProjectDetailsPage = lazy(() => import('./pages/ClientProjectDetailsPage'));
const ClientProjectsPage = lazy(() => import('./pages/ClientProjectsPage'));
const ClientProposalsPage = lazy(() => import('./pages/ClientProposalsPage'));
const StudentMarketplacePage = lazy(() => import('./pages/StudentMarketplacePage'));
const PublicJobDetailsPage = lazy(() => import('./pages/PublicJobDetailsPage'));
const GigDetailsPage = lazy(() => import('./pages/GigDetailsPage'));
const GigCustomOffersPage = lazy(() => import('./pages/GigCustomOffersPage'));
const NotificationPage = lazy(() => import('./pages/NotificationPage'));

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      API.get('/auth/me')
        .then(res => setCurrentUser(res.data.user))
        .catch(() => localStorage.removeItem('token'));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  // A subtle loading fallback that matches your dark theme
  const PageLoader = () => (
    <div className="flex items-center justify-center h-[50vh] text-indigo-400/70">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm tracking-widest uppercase">Loading</p>
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-indigo-500 selection:text-white w-full">
        
        {/* Ambient Glowing Mesh */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[160px]" />
          <div className="absolute top-1/3 right-10 w-[550px] h-[550px] bg-violet-600/15 rounded-full blur-[160px]" />
          <div className="absolute bottom-10 left-1/3 w-[700px] h-[700px] bg-emerald-600/10 rounded-full blur-[180px]" />
        </div>

        {/* Global Navbar - NOT lazy loaded so it appears instantly */}
        <Navbar currentUser={currentUser} onLogout={handleLogout} />

        {/* Main Content Area */}
        <main className="flex-1 w-full px-6 sm:px-8 lg:px-10 py-8 z-10">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/post-job" element={<PostJobPage currentUser={currentUser} />} />
              <Route path="/" element={<HomePage currentUser={currentUser} />} />
              
              {/* 1. Dedicated Admin Console */}
              <Route path="/admin" element={<AdminDashboard currentUser={currentUser} />} />
              
              {/* 2. Dedicated Skill Search Directory */}
              <Route path="/skills" element={<SkillSearchPage currentUser={currentUser} />} />
              <Route path="/browse-skills" element={<SkillSearchPage currentUser={currentUser} />} />
              <Route path="/talent-search" element={<SkillSearchPage currentUser={currentUser} />} />
              
              {/* 3. Direct Category URLs */}
              <Route path="/webdeveloper" element={<CategoryHubPage currentUser={currentUser} />} />
              <Route path="/web-development" element={<CategoryHubPage currentUser={currentUser} />} />
              <Route path="/editing" element={<CategoryHubPage currentUser={currentUser} />} />
              <Route path="/video-editing" element={<CategoryHubPage currentUser={currentUser} />} />
              <Route path="/graphic-design" element={<CategoryHubPage currentUser={currentUser} />} />
              <Route path="/python-scripting" element={<CategoryHubPage currentUser={currentUser} />} />
              <Route path="/mobile-apps" element={<CategoryHubPage currentUser={currentUser} />} />
              <Route path="/3d-artists" element={<CategoryHubPage currentUser={currentUser} />} />
              
              <Route path="/hire/:categorySlug" element={<HireCategoryPage currentUser={currentUser} />} />
              <Route path="/category/:categorySlug" element={<CategoryHubPage currentUser={currentUser} />} />
              <Route path="/jobs" element={<StudentMarketplacePage />} />
              <Route path="/jobs/:jobId" element={<PublicJobDetailsPage currentUser={currentUser} />} />
              <Route path="/gigs/:gigId" element={<GigDetailsPage currentUser={currentUser} />} />
              <Route path="/custom-offers" element={<GigCustomOffersPage currentUser={currentUser} />} />
              <Route path="/gigs" element={<CategoryHubPage currentUser={currentUser} />} />
              
              {/* User Profiles */}
              <Route path="/u/:username" element={<UserProfilePage currentUser={currentUser} />} />
              <Route path="/profile/:username" element={<UserProfilePage currentUser={currentUser} />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage onLoginSuccess={setCurrentUser} />} />
              <Route path="/register" element={<RegisterPage onLoginSuccess={setCurrentUser} />} />
              
              {/* Workspaces */}
              <Route path="/student/portal" element={<StudentDashboard currentUser={currentUser} />} />
              <Route path="/student/orders" element={<StudentOrdersPage currentUser={currentUser} />} />
              <Route path="/student/gigs" element={<StudentGigsPage currentUser={currentUser} />} />
              <Route path="/student/gigs/create" element={<StudentGigCreatePage currentUser={currentUser} />} />
              <Route path="/client/portal" element={<ClientDashboard currentUser={currentUser} />} />
              <Route path="/my-projects" element={<ClientProjectsPage />} />
              <Route path="/my-projects/:projectId" element={<ClientProjectDetailsPage />} />
              <Route path="/my-projects/:projectId/proposals" element={<ClientProposalsPage />} />
              <Route path="/orders/:orderId" element={<OrderWorkspacePage currentUser={currentUser} />} />
              <Route path="/notifications" element={<NotificationPage />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}
