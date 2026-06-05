import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/auth/Login";
import Register from "./pages/Register";
import StudentHome from "./pages/dashboard/StudentHome"; // New Dashboard
import Dashboard from "./pages/Dashboard"; // Legacy
import MinimalDashboard from "./pages/MinimalDashboard"; // New Minimalistic Design
import ReviewMode from "./pages/ReviewMode";
import Landing from "./pages/Landing";
import ErrorBoundary from "./components/ErrorBoundary";

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

// Public Route Wrapper (user logged in -> dashboard)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (user) return <Navigate to="/dashboard" />;

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route path="/" element={<Landing />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MinimalDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learn"
              element={
                <ProtectedRoute>
                  <MinimalDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learn/:courseId"
              element={
                <ProtectedRoute>
                  <MinimalDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/practice/:questionId"
              element={
                <ProtectedRoute>
                  <MinimalDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/legacy-dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/review"
              element={
                <ProtectedRoute>
                  <ReviewMode />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
