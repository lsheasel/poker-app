// src/router.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import Signin from "./components/Signin";
import Signup from "./components/Signup";
import Profile from "./components/Profile";
import Recovery from "./components/Recovery";
import UpdatePassword from "./components/UpdatePassword";
import PokerPass from "./components/BattlePass";
import LevelSystem from "./components/LevelSystem";
import LandingPage from "./components/LandingPage";
import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  // LandingPage ist die Startseite
  {
    path: "/",
    element: <LandingPage />,
  },
  // Öffentliche Spielrouten
  {
    path: "/lobby",
    element: <App />,
  },
  {
    path: "/game/:lobbyId",
    element: <App />,
  },
  // Authentifizierung
  {
    path: "/login",
    element: <Signin />,
  },
  {
    path: "/register",
    element: <Signup />,
  },
  {
    path: "/forgot-password",
    element: <Recovery />,
  },
  // Geschützte Bereiche
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/pokerpass",
    element: (
      <ProtectedRoute>
        <PokerPass />
      </ProtectedRoute>
    ),
  },
  {
    path: "/level",
    element: (
      <ProtectedRoute>
        <LevelSystem />
      </ProtectedRoute>
    ),
  },
  {
    path: "/updatepassword",
    element: (
      <ProtectedRoute>
        <UpdatePassword />
      </ProtectedRoute>
    ),
  },
  // 404 Fallback
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
],
{
  future: {
    v7_startTransition: true,
  },
});