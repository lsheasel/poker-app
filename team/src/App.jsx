import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom'; // Entferne BrowserRouter/Router
import { UserAuth } from './context/AuthContext';
import Login from './components/Login';
import TeamPanel from './components/TeamPanel';

const App = () => {
  const auth = UserAuth();
  
  // Fallback, falls UserAuth nicht verfügbar ist
  if (!auth) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  const { session, loading } = auth;

  // Warte, bis die Authentifizierung geladen ist
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/panel/dashboard" /> : <Login />}
      />
      <Route
        path="/panel/*"
        element={session ? <TeamPanel /> : <Navigate to="/login" />}
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default App;