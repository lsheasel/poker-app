import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { UserAuth } from './context/AuthContext';
import Login from './components/Login';
import TeamPanel from './components/TeamPanel';

const App = () => {
  const auth = UserAuth();
  
  if (!auth) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  const { session, loading } = auth;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/panel/dashboard" replace />} />
      <Route
        path="/login"
        element={session ? <Navigate to="/panel/dashboard" replace /> : <Login />}
      />
      <Route
        path="/panel/*"
        element={session ? <TeamPanel /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;