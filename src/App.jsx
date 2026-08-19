import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SkinAnalysisProvider } from "./contexts/SkinAnalysisContext";
import { Landing } from "./pages/Landing";
import { LoginPage } from "./pages/LoginPage";
import { Dashboard } from "./pages/Dashboard";
import PrivacySettings from "./pages/PrivacySettings";
import CookieConsentBanner from "./components/CookieConsentBanner";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <SkinAnalysisProvider>
              <Dashboard />
            </SkinAnalysisProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/privacy"
        element={
          <ProtectedRoute>
            <PrivacySettings />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppRouter />
          <CookieConsentBanner />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
