// src/router.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import TeamPanel from "./components/TeamPanel";
import Login from "./components/Login";
import { UserAuth } from "./context/AuthContext";
import React from "react";

const ProtectedRoute = ({ children }) => {
  const { session, loading } = UserAuth();
  if (loading) return <div>Loading...</div>;
  if (!session) return <Navigate to="/login" />;
  return children;
};

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Navigate to="/panel/dashboard" />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/panel/*",
      element: (
        <ProtectedRoute>
          <TeamPanel />
        </ProtectedRoute>
      ),
    },
    {
      path: "*",
      element: <Navigate to="/login" />,
    },
  ],
  { basename: '/' }
);