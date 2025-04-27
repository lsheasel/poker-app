const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket']
});

// Game state
let lobbies = {};

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);
  let currentLobby = null;

  socket.on("createLobby", (lobbyName, playerName) => {
    console.log(`Creating lobby ${lobbyName} for ${playerName}`);
    
    if (lobbies[lobbyName]) {
      socket.emit("error", "Lobby already exists");
      return;
    }

    currentLobby = lobbyName;
    lobbies[lobbyName] = {
      host: socket.id,
      players: [{ id: socket.id, name: playerName, chips: 1000 }],
      gameStarted: false,
      deck: [],
      communityCards: [],
      currentPlayer: 0,
      pot: 0,
      currentPlayerIndex: 0, // Start bei Spieler 0
      actionCount: 0,        // <--- NEU: Zählt Aktionen in der aktuellen Runde
      currentBet: 0          // <--- aktueller Höchstbetrag in dieser Runde
    };

    socket.join(lobbyName);
    socket.emit("lobbyCreated", lobbyName);
    io.to(lobbyName).emit("updatePlayers", lobbies[lobbyName].players); // <--- HINZUFÜGEN
  });

  socket.on("joinLobby", (lobbyName, playerName) => {
    console.log(`${playerName} joining lobby ${lobbyName}`);
    
    if (!lobbies[lobbyName]) {
      socket.emit("error", "Lobby doesn't exist");
      return;
    }

    lobbies[lobbyName].players.push({ id: socket.id, name: playerName, chips: 1000 });
    socket.join(lobbyName);
    io.to(lobbyName).emit("playerJoined", lobbies[lobbyName].players);
    io.to(lobbyName).emit("updatePlayers", lobbies[lobbyName].players);
  });

  socket.on("startGame", (lobbyName) => {
    console.log(`Starting game in lobby ${lobbyName}`);
    const lobby = lobbies[lobbyName];
    
    if (!lobby || lobby.gameStarted) {
      console.log("Game cannot start:", !lobby ? "Lobby not found" : "Game already started");
      return;
    }
    
    const deck = generateDeck();
    const { hands, remainingDeck } = dealCards(deck, lobby.players.length);
    
    lobby.deck = remainingDeck;
    lobby.gameStarted = true;

    // Send individual hands to each player with a delay
    lobby.players.forEach((player, index) => {
      setTimeout(() => {
        io.to(player.id).emit("dealCards", {
          hand: hands[index],
          position: index,
          isCurrentPlayer: index === 0,
          gameStarted: true
        });
      }, 500); // 500ms delay
    });

    // Broadcast game start with more information
    io.to(lobbyName).emit("gameStarted", {
      currentPlayer: lobby.players[0].id,
      players: lobby.players,
      pot: 0,
      gameStarted: true
    });
    io.to(lobbyName).emit("updatePlayers", lobby.players); // <--- HINZUFÜGEN

    // Nach dem Austeilen der Karten, am Ende von "startGame":
    lobby.currentPlayerIndex = 0;
    const currentPlayerId = lobby.players[0].id;
    io.to(lobbyName).emit("currentPlayer", { playerId: currentPlayerId });
  });

  // Einsatz setzen
  socket.on("bet", ({ lobbyName, amount }) => {
    console.log(`[BET] Spieler ${socket.id} setzt ${amount} in Lobby ${lobbyName}`); // DEBUG

    const lobby = lobbies[lobbyName];
    if (!lobby || !lobby.gameStarted) {
      console.log(`[BET] Lobby ${lobbyName} nicht gefunden oder Spiel nicht gestartet!`); // DEBUG
      return;
    }

    // Spieler finden und Chips abziehen
    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) {
      console.log(`[BET] Spieler ${socket.id} nicht in Lobby gefunden!`); // DEBUG
      return;
    }

    console.log(`[BET] Vorher: Spieler-Chips: ${player.chips}, Pot: ${lobby.pot}`); // DEBUG

    if (player.chips < amount) {
      console.log(`[BET] Spieler ${socket.id} hat nicht genug Chips! (${player.chips} < ${amount})`); // DEBUG
      socket.emit("error", "Nicht genug Chips!");
      return;
    }

    player.chips -= amount;
    lobby.pot += amount;
    lobby.currentBet = amount; // <--- HIER: aktueller Einsatz für diese Runde

    console.log(`[BET] Nachher: Spieler-Chips: ${player.chips}, Pot: ${lobby.pot}`); // DEBUG

    // An alle Spieler senden
    io.to(lobbyName).emit("updatePot", { pot: lobby.pot });
    io.to(lobbyName).emit("updatePlayerChips", {
      playerId: player.id,
      chips: player.chips
    });
    io.to(lobbyName).emit("updatePlayers", lobby.players);

    // Nach Chips/Pot/Player-Logik, VOR Spielerwechsel:
    lobby.actionCount = (lobby.actionCount || 0) + 1;

    if (lobby.actionCount >= lobby.players.length) {
      lobby.actionCount = 0;

      // Wenn alle 5 Community Cards liegen, ist die Runde vorbei!
      if (lobby.communityCards.length === 5) {
        // Showdown: Gewinner bestimmen (hier Dummy: erster Spieler)
        const winner = lobby.players[0]; // TODO: Echte Poker-Logik einbauen!
        winner.chips += lobby.pot;

        // Allen Spielern neuen Chipstand schicken
        lobby.players.forEach(player => {
          io.to(lobbyName).emit("updatePlayerChips", {
            playerId: player.id,
            chips: player.chips
          });
        });

        io.to(lobbyName).emit("roundEnded", { winnerId: winner.id, pot: lobby.pot });

        // Kurze Pause, dann neue Runde starten
        setTimeout(() => {
          startNewRound(lobbyName);
        }, 3000);
        return; // NICHT mehr zum nächsten Spieler wechseln!
      }

      // Sonst wie gehabt: nächste Community Card aufdecken
      revealNextCommunityCard(lobbyName);
    }

    // Dann wie gehabt zum nächsten Spieler (nur wenn noch nicht beendet):
    lobby.currentPlayerIndex = (lobby.currentPlayerIndex + 1) % lobby.players.length;
    const currentPlayerId = lobby.players[lobby.currentPlayerIndex].id;
    io.to(lobbyName).emit("currentPlayer", { playerId: currentPlayerId });
  });

  // Call
  socket.on("call", ({ lobbyName }) => {
    const lobby = lobbies[lobbyName];
    if (!lobby || !lobby.gameStarted) return;

    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) return;

    const toCall = lobby.currentBet;
    if (player.chips < toCall) {
      socket.emit("error", "Nicht genug Chips zum Callen!");
      return;
    }

    player.chips -= toCall;
    lobby.pot += toCall;

    io.to(lobbyName).emit("updatePot", { pot: lobby.pot });
    io.to(lobbyName).emit("updatePlayerChips", {
      playerId: player.id,
      chips: player.chips
    });
    io.to(lobbyName).emit("updatePlayers", lobby.players);

    // Setzrunden-Logik wie gehabt:
    lobby.actionCount = (lobby.actionCount || 0) + 1;
    if (lobby.actionCount >= lobby.players.length) {
      lobby.actionCount = 0;

      // Wenn alle 5 Community Cards liegen, ist die Runde vorbei!
      if (lobby.communityCards.length === 5) {
        // Showdown: Gewinner bestimmen (hier Dummy: erster Spieler)
        const winner = lobby.players[0]; // TODO: Echte Poker-Logik einbauen!
        winner.chips += lobby.pot;

        // Allen Spielern neuen Chipstand schicken
        lobby.players.forEach(player => {
          io.to(lobbyName).emit("updatePlayerChips", {
            playerId: player.id,
            chips: player.chips
          });
        });

        io.to(lobbyName).emit("roundEnded", { winnerId: winner.id, pot: lobby.pot });

        // Kurze Pause, dann neue Runde starten
        setTimeout(() => {
          startNewRound(lobbyName);
        }, 3000);
        return; // NICHT mehr zum nächsten Spieler wechseln!
      }

      // Sonst wie gehabt: nächste Community Card aufdecken
      revealNextCommunityCard(lobbyName);
    }

    // Dann wie gehabt zum nächsten Spieler (nur wenn noch nicht beendet):
    lobby.currentPlayerIndex = (lobby.currentPlayerIndex + 1) % lobby.players.length;
    const currentPlayerId = lobby.players[lobby.currentPlayerIndex].id;
    io.to(lobbyName).emit("currentPlayer", { playerId: currentPlayerId });
  });

  // Fold
  socket.on("fold", ({ lobbyName }) => {
    const lobby = lobbies[lobbyName];
    if (!lobby || !lobby.gameStarted) return;

    // Beispiel: Spieler aus Runde nehmen
    // lobby.players = lobby.players.filter(p => p.id !== socket.id);
    io.to(lobbyName).emit("playerFolded", { playerId: socket.id });

    // Hier weitere Logik (z.B. Runde beenden, Gewinner bestimmen)

    // Nach Chips/Pot/Player-Logik, VOR Spielerwechsel:
    lobby.actionCount = (lobby.actionCount || 0) + 1;

    if (lobby.actionCount >= lobby.players.length) {
      lobby.actionCount = 0;

      // Wenn alle 5 Community Cards liegen, ist die Runde vorbei!
      if (lobby.communityCards.length === 5) {
        // Showdown: Gewinner bestimmen (hier Dummy: erster Spieler)
        const winner = lobby.players[0]; // TODO: Echte Poker-Logik einbauen!
        winner.chips += lobby.pot;

        // Allen Spielern neuen Chipstand schicken
        lobby.players.forEach(player => {
          io.to(lobbyName).emit("updatePlayerChips", {
            playerId: player.id,
            chips: player.chips
          });
        });

        io.to(lobbyName).emit("roundEnded", { winnerId: winner.id, pot: lobby.pot });

        // Kurze Pause, dann neue Runde starten
        setTimeout(() => {
          startNewRound(lobbyName);
        }, 3000);
        return; // NICHT mehr zum nächsten Spieler wechseln!
      }

      // Sonst wie gehabt: nächste Community Card aufdecken
      revealNextCommunityCard(lobbyName);
    }

    // Dann wie gehabt zum nächsten Spieler (nur wenn noch nicht beendet):
    lobby.currentPlayerIndex = (lobby.currentPlayerIndex + 1) % lobby.players.length;
    const currentPlayerId = lobby.players[lobby.currentPlayerIndex].id;
    io.to(lobbyName).emit("currentPlayer", { playerId: currentPlayerId });
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    if (currentLobby) {
      const lobby = lobbies[currentLobby];
      if (lobby) {
        lobby.players = lobby.players.filter(p => p.id !== socket.id);
        if (lobby.players.length === 0) {
          delete lobbies[currentLobby];
        } else {
          io.to(currentLobby).emit("playerLeft", lobby.players);
          io.to(currentLobby).emit("updatePlayers", lobby.players); // <--- HINZUFÜGEN
        }
      }
    }
  });
});

server.listen(3002, () => {  // Port von 3001 zu 3002 geändert
  console.log("Server running on port 3002");
});

// Helper functions remain the same
const generateDeck = () => {
  const suits = ["hearts", "diamonds", "clubs", "spades"];
  const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck = [];

  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }

  // Shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

const dealCards = (deck, numPlayers) => {
  const hands = [];
  for (let i = 0; i < numPlayers; i++) {
    hands.push(deck.splice(0, 2));
  }
  return { hands, remainingDeck: deck };
};

const dealCommunityCards = (deck, stage) => {
  let cards = [];
  switch (stage) {
    case 'flop':
      cards = deck.splice(0, 3);
      break;
    case 'turn':
    case 'river':
      cards = deck.splice(0, 1);
      break;
  }
  return { cards, remainingDeck: deck };
};

// Beispiel: Nach einer Runde (alle Spieler haben gesetzt/called)
const revealNextCommunityCard = (lobbyName) => {
  const lobby = lobbies[lobbyName];
  if (!lobby) return;

  let stage = lobby.communityCards.length;
  let cardsToDeal = 0;
  if (stage === 0) cardsToDeal = 3; // Flop
  else if (stage === 3) cardsToDeal = 1; // Turn
  else if (stage === 4) cardsToDeal = 1; // River

  if (cardsToDeal > 0) {
    const newCards = lobby.deck.splice(0, cardsToDeal);
    lobby.communityCards.push(...newCards);
    io.to(lobbyName).emit("communityCards", { cards: lobby.communityCards });
  }

  lobby.currentBet = 0;

  // --- NEU: Nach dem River Gewinner bestimmen und neue Runde starten ---
  if (lobby.communityCards.length === 5) {
    // Dummy-Gewinner: Spieler mit den meisten Chips (ersetze das durch echte Poker-Logik!)
    // Hier solltest du eine echte Pokerhand-Auswertung machen!
    const winner = lobby.players.reduce((a, b) => a.chips > b.chips ? a : b);

    // Pot auszahlen
    winner.chips += lobby.pot;

    // Allen Spielern neuen Chipstand schicken
    lobby.players.forEach(player => {
      io.to(lobbyName).emit("updatePlayerChips", {
        playerId: player.id,
        chips: player.chips
      });
    });

    io.to(lobbyName).emit("roundEnded", { winnerId: winner.id, pot: lobby.pot });

    // Kurze Pause, dann neue Runde starten
    setTimeout(() => {
      startNewRound(lobbyName);
    }, 3000);
  }
};

function startNewRound(lobbyName) {
  const lobby = lobbies[lobbyName];
  if (!lobby) return;

  lobby.deck = generateDeck();
  lobby.communityCards = [];
  lobby.pot = 0;
  lobby.currentBet = 0;
  lobby.actionCount = 0;
  lobby.gameStarted = true;

  const { hands, remainingDeck } = dealCards(lobby.deck, lobby.players.length);
  lobby.deck = remainingDeck;

  lobby.players.forEach((player, index) => {
    io.to(player.id).emit("dealCards", {
      hand: hands[index],
      position: index,
      isCurrentPlayer: index === 0,
      gameStarted: true
    });
  });

  io.to(lobbyName).emit("updatePot", { pot: 0 });
  io.to(lobbyName).emit("communityCards", { cards: [] });

  lobby.currentPlayerIndex = 0;
  const currentPlayerId = lobby.players[0].id;
  io.to(lobbyName).emit("currentPlayer", { playerId: currentPlayerId });
}