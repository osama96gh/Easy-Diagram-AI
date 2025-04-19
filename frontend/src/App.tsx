import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { MainLayout } from './components/layout';
import { FullScreenDiagram } from './components/diagram';
import { DiagramProvider } from './contexts/DiagramContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm, PasswordReset, UpdatePassword } from './components/auth';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Protected route component
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { session, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
      </div>
    );
  }
  
  return session ? element : <Navigate to="/login" replace />;
};

// Public route component - redirects to home if already authenticated
const PublicRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { session, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
      </div>
    );
  }
  
  return session ? <Navigate to="/" replace /> : element;
};

/**
 * Main App component that sets up the routing for the application
 */
function App() {
  return (
    <AuthProvider>
      <DiagramProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<PublicRoute element={<AuthForm />} />} />
          <Route path="/reset-password" element={<PublicRoute element={<PasswordReset />} />} />
          <Route path="/update-password" element={<PublicRoute element={<UpdatePassword />} />} />
          
          {/* Protected routes */}
          <Route path="/diagram/:diagramId" element={<ProtectedRoute element={<FullScreenDiagram />} />} />
          <Route path="/" element={<ProtectedRoute element={<MainLayout />} />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DiagramProvider>
    </AuthProvider>
  );
}

export default App;
