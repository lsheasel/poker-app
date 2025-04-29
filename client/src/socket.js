import { io } from "socket.io-client";

const socket = io("https://poker-app-backend.onrender.com", {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  autoConnect: true
});

socket.on("connect", () => {
  console.log("Socket connected with ID:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

socket.on("dealCards", (data) => {
  console.log("socket.js: dealCards global listener:", data);
});

export default socket;
