// src/App.tsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "./components/ui/toaster";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { GoogleAnalytics } from "./components/GoogleAnalytics";

// ✅ Pages
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ChurchServicesPage } from "./pages/ChurchServicesPage";
import { CampaignDetailPage } from "./pages/CampaignDetailPage";
import { Dashboard } from "./pages/Dashboard";
import { DashboardOverview } from "./pages/DashboardOverview";
import { AdminDashboard } from "./pages/AdminDashboard";
import CreateCampaignPage from "./pages/CreateCampaignPage";
import CampaignPage from "./pages/CampaignsPage";
import AboutPage from "./pages/AboutPage";

// Auth Pages (PUBLIC)
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

//Dashboard pages
import {DonationsPage} from "./pages/dashboard/DonationsPage";
import {MyCampaignsPage} from "./pages/dashboard/MyCampaignsPage2";
//import {ChatPage} from "./pages/dashboard/ChatPage";
//import {NotificationsPage} from "./pages/dashboard/NotificationsPage";
import {ProfilePage} from "./pages/dashboard/ProfilePage";
import {WithdrawalsPage} from "./pages/dashboard/WithdrawalsPage";

// ✅ Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// ✅ Main App Content (All Routes)
const AppContent: React.FC = () => (
  <Router>
    <GoogleAnalytics />
    <Routes>
      {/* 🏠 Home */}
      <Route
        path="/"
        element={
          <>
            <Navbar />
            <HomePage />
            <Footer />
          </>
        }
      />

      {/* 📖 About */}
      <Route
        path="/about"
        element={
          <>
            <Navbar />
            <AboutPage />
            <Footer />
          </>
        }
      />

      {/* ⛪ Church Services */}
      <Route
        path="/church-services"
        element={
          <>
            <Navbar />
            <ChurchServicesPage />
            <Footer />
          </>
        }
      />

      {/* 🔐 Auth Pages */}
      <Route
        path="/login"
        element={
          <>
            <Navbar />
            <LoginPage />
          </>
        }
      />
      <Route
        path="/register"
        element={
          <>
            <Navbar />
            <RegisterPage />
          </>
        }
      />

      {/* 🎯 Campaign Details */}
      <Route
        path="/campaign/:param"
        element={
          <>
            <Navbar />
            <CampaignDetailPage />
            <Footer />
          </>
        }
      />

      {/* 🆕 Create Campaign */}
      <Route
        path="/create-campaign"
        element={
          <>
            <Navbar />
            <CreateCampaignPage />
            <Footer />
          </>
        }
      />

      {/* 📂 All Campaigns */}
      <Route
        path="/campaigns"
        element={
          <>
            <Navbar />
            <CampaignPage />
            <Footer />
          </>
        }
      />

      {/* EMAIL + PASSWORD HANDLING (PUBLIC) */}
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* 👤 Protected User Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardOverview />} />
         <Route path="campaigns" element={<MyCampaignsPage />} />
          <Route path="donations" element={<DonationsPage />} />
          <Route path="withdrawals" element={<WithdrawalsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          {/*<Route path="chat" element={<ChatPage />} />
          <Route path="notifications" element={<NotificationsPage />} />*/}
      </Route>

      {/* 🧭 Protected Admin Dashboard */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <AdminDashboard />
            </>
          </ProtectedRoute>
        }
      />
    </Routes>

    {/* ✅ Global Toasts */}
    <Toaster />
  </Router>
);

// ✅ Main App Wrapper (Providers + Persistent Watermark Removal)
function App() {
  useEffect(() => {
    // 🔁 Continuously check & remove Blink watermark for a few seconds
    const interval = setInterval(() => {
      const badge = document.querySelector("#blink-badge-container");
      if (badge) {
        badge.remove();
        console.log("✅ removed");
      }
    }, 1000);

    // stop checking after 10 seconds
    const stop = setTimeout(() => clearInterval(interval), 10000);

    // cleanup
    return () => {
      clearInterval(interval);
      clearTimeout(stop);
    };
  }, []);

  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
