// src/router.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import TeamPanel from "./components/TeamPanel";
import Login from "./components/Login";
import { UserAuth } from "./context/AuthContext";
import React from "react";

// Wrapper für geschützte Routen
const ProtectedRoute = ({ children }) => {
  const { session, loading } = UserAuth();
  if (loading) return <div>Loading...</div>;
  if (!session) return <Navigate to="/login" />;
  return children;
};

export const router = createBrowserRouter(
  [
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
      path: "/",
      element: <Navigate to="/panel/dashboard" />,
    },
    {
      path: "*",
      element: <Navigate to="/login" />,
    },
  ],
  {
    future: {
      v7_startTransition: true,
    },
  }
);