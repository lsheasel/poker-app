import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signup from "./components/Signup";
import Signin from "./components/Signin";
import Profile from "./components/Profile";
import Recovery from "./components/Recovery";
import UpdatePassword from "./components/UpdatePassword";
import Multiplayer from "./components/Multiplayer";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/register", element: <Signup /> },
  { path: "/login", element: <Signin /> },
  { path: "/forgot-password", element: <Recovery /> },
  { path: "/update-password", element: <UpdatePassword /> },
  {
    path: "/profile",
    element: (
        <Profile />
    ),
  },
]);