import { io } from "socket.io-client";
const SocketUrl = import.meta.env.VITE_SOCKET_URL;

const socket = io(SocketUrl, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  autoConnect: true
});


export default socket;
