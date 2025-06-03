import Peer from 'peerjs';

class P2PService {
  constructor() {
    this.peer = new Peer();
    this.connections = new Map();
  }

  hostGame() {
    return new Promise((resolve) => {
      this.peer.on('open', (id) => {
        resolve(id);
      });
    });
  }

  joinGame(hostId) {
    const conn = this.peer.connect(hostId);
    this.connections.set(hostId, conn);
    
    conn.on('open', () => {
      console.log('Connected to host');
    });
  }
}

export default new P2PService();