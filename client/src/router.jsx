// src/router.jsx
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signup from "./components/Signup";
import Signin from "./components/Signin";
import Profile from "./components/Profile";
import Recovery from "./components/Recovery";
import UpdatePassword from "./components/UpdatePassword";
import PokerPass from "./components/BattlePass";
import LevelSystem from "./components/LevelSystem";

export const router = createBrowserRouter(
  [
    { path: "/", element: <App /> },
    { path: "/register", element: <Signup /> },
    { path: "/login", element: <Signin /> },
    { path: "/forgot--password", element: <Recovery /> },
    { path: "/updatepassword", element: <UpdatePassword /> },
    { path: "/pokerpass", element: <PokerPass /> },
    { path: "/level", element: <LevelSystem /> },
    { path: "/profile", element: <Profile /> },
    { path: "*", element: <div>404 - Seite nicht gefunden</div> }, // Fallback-Route
  ],
  {
    future: {
      v7_startTransition: true,
    },
  }
);