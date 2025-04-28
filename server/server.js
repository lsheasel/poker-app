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
      currentPlayerIndex: 0,
      actionCount: 0,
      currentBet: 0,
      gameState: "preflop", // Mögliche Zustände: preflop, flop, turn, river, finalBetting, showdown
      showdownInProgress: false
    };

    socket.join(lobbyName);
    socket.emit("lobbyCreated", lobbyName);
    io.to(lobbyName).emit("updatePlayers", lobbies[lobbyName].players);
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
    lobby.gameState = "preflop";
    lobby.showdownInProgress = false;

    lobby.players.forEach((player, index) => {
      setTimeout(() => {
        io.to(player.id).emit("dealCards", {
          hand: hands[index],
          position: index,
          isCurrentPlayer: index === 0,
          gameStarted: true
        });
      }, 500);
    });

    io.to(lobbyName).emit("gameStarted", {
      currentPlayer: lobby.players[0].id,
      players: lobby.players,
      pot: 0,
      gameStarted: true
    });
    io.to(lobbyName).emit("updatePlayers", lobby.players);

    lobby.currentPlayerIndex = 0;
    const currentPlayerId = lobby.players[0].id;
    io.to(lobbyName).emit("currentPlayer", { playerId: currentPlayerId });
  });

  socket.on("bet", ({ lobbyName, amount }) => {
    console.log(`[BET] Spieler ${socket.id} setzt ${amount} in Lobby ${lobbyName}, State: ${lobbies[lobbyName]?.gameState}`);

    const lobby = lobbies[lobbyName];
    if (!lobby || !lobby.gameStarted || lobby.showdownInProgress) {
      console.log(`[BET] Lobby ${lobbyName} nicht gefunden, Spiel nicht gestartet, oder bereits im Showdown`);
      return;
    }

    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) {
      console.log(`[BET] Spieler ${socket.id} nicht in Lobby gefunden!`);
      return;
    }

    if (player.chips < amount) {
      console.log(`[BET] Spieler ${socket.id} hat nicht genug Chips! (${player.chips} < ${amount})`);
      socket.emit("error", "Nicht genug Chips!");
      return;
    }

    player.chips -= amount;
    lobby.pot += amount;
    lobby.currentBet = Math.max(amount, lobby.currentBet || 0);  // Sicherstellen, dass currentBet nicht null ist

    io.to(lobbyName).emit("updatePot", { pot: lobby.pot });
    io.to(lobbyName).emit("updatePlayerChips", { playerId: player.id, chips: player.chips });
    io.to(lobbyName).emit("updatePlayers", lobby.players);

    lobby.actionCount = (lobby.actionCount || 0) + 1;

    if (lobby.actionCount >= lobby.players.length) {
      lobby.actionCount = 0;
      
      console.log(`[BET] Alle Spieler haben gesetzt, aktueller Zustand: ${lobby.gameState}`);
      
      // Übergang zum nächsten Spielzustand
      advanceGameState(lobby, lobbyName);
    }

    lobby.currentPlayerIndex = (lobby.currentPlayerIndex + 1) % lobby.players.length;
    const currentPlayerId = lobby.players[lobby.currentPlayerIndex].id;
    io.to(lobbyName).emit("currentPlayer", { playerId: currentPlayerId });
  });

  socket.on("call", ({ lobbyName }) => {
    console.log(`[CALL] Spieler ${socket.id} callt in Lobby ${lobbyName}, State: ${lobbies[lobbyName]?.gameState}`);
    
    const lobby = lobbies[lobbyName];
    if (!lobby || !lobby.gameStarted || lobby.showdownInProgress) {
      console.log(`[CALL] Lobby ${lobbyName} nicht gefunden, Spiel nicht gestartet, oder bereits im Showdown`);
      return;
    }

    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) {
      console.log(`[CALL] Spieler ${socket.id} nicht in Lobby gefunden!`);
      return;
    }

    // Stellen Sie sicher, dass der zu callende Betrag mindestens 1 ist
    const toCall = Math.max(1, lobby.currentBet || 0);
    if (player.chips < toCall) {
      socket.emit("error", "Nicht genug Chips zum Callen!");
      return;
    }

    player.chips -= toCall;
    lobby.pot += toCall;

    io.to(lobbyName).emit("updatePot", { pot: lobby.pot });
    io.to(lobbyName).emit("updatePlayerChips", { playerId: player.id, chips: player.chips });
    io.to(lobbyName).emit("updatePlayers", lobby.players);

    lobby.actionCount = (lobby.actionCount || 0) + 1;
    
    if (lobby.actionCount >= lobby.players.length) {
      lobby.actionCount = 0;
      
      console.log(`[CALL] Alle Spieler haben gecallt, aktueller Zustand: ${lobby.gameState}`);
      
      // Übergang zum nächsten Spielzustand
      advanceGameState(lobby, lobbyName);
    }

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
          io.to(currentLobby).emit("updatePlayers", lobby.players);
        }
      }
    }
  });
});

// Neue Funktion zum Fortschreiten des Spielzustands
function advanceGameState(lobby, lobbyName) {
  console.log(`[ADVANCE] Fortschreiten vom Zustand ${lobby.gameState}`);
  
  switch (lobby.gameState) {
    case "preflop":
      // Nach dem Preflop kommt der Flop (erste 3 Gemeinschaftskarten)
      dealCommunityCards(lobby, lobbyName, 3);
      lobby.gameState = "flop";
      lobby.currentBet = 1;  // Mindestbetrag für den nächsten Call
      break;
      
    case "flop":
      // Nach dem Flop kommt der Turn (4. Gemeinschaftskarte)
      dealCommunityCards(lobby, lobbyName, 1);
      lobby.gameState = "turn";
      lobby.currentBet = 1;  // Mindestbetrag für den nächsten Call
      break;
      
    case "turn":
      // Nach dem Turn kommt der River (5. Gemeinschaftskarte)
      dealCommunityCards(lobby, lobbyName, 1);
      lobby.gameState = "river";
      lobby.currentBet = 1;  // Mindestbetrag für den nächsten Call
      break;
      
    case "river":
      // Nach dem River kommt die letzte Wettrunde
      lobby.gameState = "finalBetting";
      lobby.currentBet = 1;  // Mindestbetrag für den nächsten Call
      io.to(lobbyName).emit("bettingRound", { message: "Letzte Wettrunde vor dem Showdown!" });
      break;
      
    case "finalBetting":
      // Nach der letzten Wettrunde kommt der Showdown
      lobby.gameState = "showdown";
      lobby.showdownInProgress = true;
      
      console.log(`[SHOWDOWN] Spiel beendet, Gewinner wird ermittelt`);
      const winner = determineWinner(lobby);
      winner.chips += lobby.pot;
      
      io.to(lobbyName).emit("updatePlayerChips", { playerId: winner.id, chips: winner.chips });
      io.to(lobbyName).emit("roundEnded", { winnerId: winner.id, pot: lobby.pot });
      
      setTimeout(() => {
        startNewRound(lobbyName);
      }, 3000);
      break;
  }
}

function dealCommunityCards(lobby, lobbyName, count) {
  if (!lobby || !lobby.deck) return;
  
  const newCards = lobby.deck.splice(0, count);
  if (!lobby.communityCards) lobby.communityCards = [];
  lobby.communityCards.push(...newCards);
  
  console.log(`[DEAL] ${count} Gemeinschaftskarten ausgeteilt, jetzt insgesamt ${lobby.communityCards.length}`);
  io.to(lobbyName).emit("communityCards", { cards: lobby.communityCards });
}

server.listen(3002, () => {
  console.log("Server running on port 3002");
});

const generateDeck = () => {
  const suits = ["hearts", "diamonds", "clubs", "spades"];
  const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck = [];

  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }

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

function startNewRound(lobbyName) {
  const lobby = lobbies[lobbyName];
  if (!lobby) return;

  console.log(`[NEW ROUND] Starte neue Runde in Lobby ${lobbyName}`);

  lobby.deck = generateDeck();
  lobby.communityCards = [];
  lobby.pot = 0;
  lobby.currentBet = 1;  // Setze den Mindestbetrag für den ersten Call
  lobby.actionCount = 0;
  lobby.gameStarted = true;
  lobby.gameState = "preflop";
  lobby.showdownInProgress = false;

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

const determineWinner = (lobby) => {
  // Beispiel für die Bestimmung des Gewinners: Hier verwenden wir den Spieler mit den meisten Chips als Platzhalter
  return lobby.players.reduce((a, b) => a.chips > b.chips ? a : b);
};