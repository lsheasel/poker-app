const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");





const app = express();
app.use(cors());

app.use(cors({
  origin: ['https://discord.com', 'https://poker4fun.xyz'],
  credentials: true
}));




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
  let currentLobby = null;

  socket.on("createLobby", (lobbyName, playerName, avatar_url) => {
    
    if (lobbies[lobbyName]) {
      socket.emit("error", "Lobby already exists");
      return;
    }

    currentLobby = lobbyName;
    lobbies[lobbyName] = {
      host: socket.id,
      players: [{ id: socket.id, name: playerName, chips: 1000, hand: [], avatar_url: avatar_url}], // Added hand array for each player
      gameStarted: false,
      deck: [],
      communityCards: [],
      currentPlayer: 0,
      pot: 0,
      currentPlayerIndex: 0,
      actionCount: 0,
      currentBet: 0,
      // Corrected game states: preflop, flop, turn, river, showdown (5 rounds total)
      gameState: "preflop", 
      showdownInProgress: false
    };

    socket.join(lobbyName);
    socket.emit("lobbyCreated", lobbyName);
    io.to(lobbyName).emit("updatePlayers", lobbies[lobbyName].players);
  });

  socket.on("joinLobby", (lobbyName, playerName, avatar_url) => {
    
    if (!lobbies[lobbyName]) {
      socket.emit("error", "Lobby doesn't exist");
      return;
    }

    lobbies[lobbyName].players.push({ id: socket.id, name: playerName, chips: 1000, hand: [], avatar_url: avatar_url}); // Added hand array for each player
    socket.join(lobbyName);
    io.to(lobbyName).emit("playerJoined", lobbies[lobbyName].players);
    io.to(lobbyName).emit("updatePlayers", lobbies[lobbyName].players);
  });

  socket.on("startGame", (lobbyName) => {
    const lobby = lobbies[lobbyName];
    
    if (!lobby || lobby.gameStarted) {
      return;
    }
    
    const deck = generateDeck();
    const { hands, remainingDeck } = dealCards(deck, lobby.players.length);
    
    lobby.deck = remainingDeck;
    lobby.gameStarted = true;
    lobby.gameState = "preflop";
    lobby.showdownInProgress = false;

    // Store player hands in the server's game state
    lobby.players.forEach((player, index) => {
      player.hand = hands[index]; // Store the hand in the player object
      
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

    const lobby = lobbies[lobbyName];
    if (!lobby || !lobby.gameStarted || lobby.showdownInProgress) {
      return;
    }

    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) {
      return;
    }

    if (player.chips < amount) {
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
      
      
      // Übergang zum nächsten Spielzustand
      advanceGameState(lobby, lobbyName);
    }

    lobby.currentPlayerIndex = (lobby.currentPlayerIndex + 1) % lobby.players.length;
    const currentPlayerId = lobby.players[lobby.currentPlayerIndex].id;
    io.to(lobbyName).emit("currentPlayer", { playerId: currentPlayerId });
  });

  socket.on("call", ({ lobbyName }) => {
    
    const lobby = lobbies[lobbyName];
    if (!lobby || !lobby.gameStarted || lobby.showdownInProgress) {
      return;
    }

    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) {
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
      
      
      // Übergang zum nächsten Spielzustand
      advanceGameState(lobby, lobbyName);
    }

    lobby.currentPlayerIndex = (lobby.currentPlayerIndex + 1) % lobby.players.length;
    const currentPlayerId = lobby.players[lobby.currentPlayerIndex].id;
    io.to(lobbyName).emit("currentPlayer", { playerId: currentPlayerId });
  });
  socket.on("fold", ({ lobbyName }) => {
    
    const lobby = lobbies[lobbyName];
    if (!lobby || !lobby.gameStarted || lobby.showdownInProgress) {
      return;
    }
  
    const playerIndex = lobby.players.findIndex(p => p.id === socket.id);
    if (playerIndex === -1) {
      return;
    }
  
    // Mark the player as folded instead of removing them
    lobby.players[playerIndex].folded = true;
    
    // Notify all players about the fold
    io.to(lobbyName).emit("playerFolded", { playerId: socket.id });
    io.to(lobbyName).emit("updatePlayers", lobby.players);
  
    // Check if only one active player remains
    const activePlayers = lobby.players.filter(p => !p.folded);
    if (activePlayers.length <= 1) {
      const winner = activePlayers[0];
      winner.chips += lobby.pot;
      io.to(lobbyName).emit("roundEnded", { winnerId: winner.id, pot: lobby.pot });
      
      // Start a new round after a short delay
      setTimeout(() => {
        startNewRound(lobbyName);
      }, 3000);
      return;
    }
  
    // Move to the next active player
    let nextPlayerIndex = (playerIndex + 1) % lobby.players.length;
    // Skip folded players
    while (lobby.players[nextPlayerIndex].folded) {
      nextPlayerIndex = (nextPlayerIndex + 1) % lobby.players.length;
    }
    
    lobby.currentPlayerIndex = nextPlayerIndex;
    const currentPlayerId = lobby.players[lobby.currentPlayerIndex].id;
    io.to(lobbyName).emit("currentPlayer", { playerId: currentPlayerId });
  });

  socket.on("disconnect", () => {
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

// Korrigierte Funktion zum Fortschreiten des Spielzustands (5 Runden)
function advanceGameState(lobby, lobbyName) {
  const currentBet = lobbies[lobbyName]?.currentBet || 0;
  
  switch (lobby.gameState) {
    case "preflop":
      // Nach dem Preflop kommt der Flop (erste 3 Gemeinschaftskarten)
      dealCommunityCards(lobby, lobbyName, 3);
      lobby.gameState = "flop";
      lobby.currentBet = currentBet;  // Reset to 0 instead of 1
      break;
      
    case "flop":
      // Nach dem Flop kommt der Turn (4. Gemeinschaftskarte)
      dealCommunityCards(lobby, lobbyName, 1);
      lobby.gameState = "turn";
      lobby.currentBet = currentBet;  // Reset to 0 instead of 1
      break;
      
    case "turn":
      // Nach dem Turn kommt der River (5. Gemeinschaftskarte)
      dealCommunityCards(lobby, lobbyName, 1);
      lobby.gameState = "river";
      lobby.currentBet = currentBet;  // Reset to 0 instead of 1
      break;
      
    case "river":
      // Nach dem River kommt direkt der Showdown (keine finalBetting mehr)
      lobby.gameState = "showdown";
      lobby.showdownInProgress = true;
      
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


  lobby.deck = generateDeck();
  lobby.communityCards = [];
  lobby.pot = 0;
  lobby.currentBet = 0;  // Initialize to 0 instead of 1
  lobby.actionCount = 0;
  lobby.gameStarted = true;
  lobby.gameState = "preflop";
  lobby.showdownInProgress = false;

  // Reset folded status for all players
  lobby.players.forEach(player => {
    player.folded = false;
  });

  const { hands, remainingDeck } = dealCards(lobby.deck, lobby.players.length);
  lobby.deck = remainingDeck;

  // Store and send player hands
  lobby.players.forEach((player, index) => {
    player.hand = hands[index]; // Store hands in the player objects
    
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

// Card value helpers for hand evaluation
const cardValues = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

// Hand evaluation functions
function getHandRank(cards) {
  // Combine and sort the cards by value (descending)
  const sortedCards = [...cards].sort((a, b) => cardValues[b.value] - cardValues[a.value]);
  
  // Check for different poker hands (from highest to lowest)
  if (isRoyalFlush(sortedCards)) return { rank: 9, name: "Royal Flush" };
  
  const straightFlush = isStraightFlush(sortedCards);
  if (straightFlush) return { rank: 8, name: "Straight Flush", highCard: straightFlush };
  
  const fourOfAKind = isFourOfAKind(sortedCards);
  if (fourOfAKind) return { rank: 7, name: "Four of a Kind", value: fourOfAKind };
  
  const fullHouse = isFullHouse(sortedCards);
  if (fullHouse) return { rank: 6, name: "Full House", threeValue: fullHouse.three, pairValue: fullHouse.pair };
  
  const flush = isFlush(sortedCards);
  if (flush) return { rank: 5, name: "Flush", cards: flush };
  
  const straight = isStraight(sortedCards);
  if (straight) return { rank: 4, name: "Straight", highCard: straight };
  
  const threeOfAKind = isThreeOfAKind(sortedCards);
  if (threeOfAKind) return { rank: 3, name: "Three of a Kind", value: threeOfAKind };
  
  const twoPair = isTwoPair(sortedCards);
  if (twoPair) return { rank: 2, name: "Two Pair", highPair: twoPair.high, lowPair: twoPair.low };
  
  const pair = isPair(sortedCards);
  if (pair) return { rank: 1, name: "Pair", value: pair };
  
  // High card
  return { rank: 0, name: "High Card", value: cardValues[sortedCards[0].value] };
}

// Poker hand checking functions
function isRoyalFlush(cards) {
  const straight = isStraight(cards);
  const flush = isFlush(cards);
  return straight && flush && cardValues[cards[0].value] === 14; // Ace high
}

function isStraightFlush(cards) {
  const straight = isStraight(cards);
  const flush = isFlush(cards);
  return straight && flush ? cardValues[cards[0].value] : false;
}

function isFourOfAKind(cards) {
  const valueCounts = countValues(cards);
  for (const [value, count] of Object.entries(valueCounts)) {
    if (count === 4) return cardValues[value];
  }
  return false;
}

function isFullHouse(cards) {
  const valueCounts = countValues(cards);
  let threeValue = null;
  let pairValue = null;
  
  for (const [value, count] of Object.entries(valueCounts)) {
    if (count === 3) threeValue = cardValues[value];
    else if (count === 2) pairValue = cardValues[value];
  }
  
  return (threeValue && pairValue) ? { three: threeValue, pair: pairValue } : false;
}

function isFlush(cards) {
  const suits = {};
  for (const card of cards) {
    suits[card.suit] = (suits[card.suit] || 0) + 1;
    if (suits[card.suit] >= 5) {
      // Return the 5 highest cards of the flush suit
      return cards.filter(c => c.suit === card.suit).slice(0, 5);
    }
  }
  return false;
}

function isStraight(cards) {
  // Remove duplicate values
  const uniqueValues = [];
  const seen = {};
  
  for (const card of cards) {
    if (!seen[card.value]) {
      uniqueValues.push(card);
      seen[card.value] = true;
    }
  }
  
  // Check for A-5 straight (special case)
  if (uniqueValues.length >= 5 && 
      uniqueValues.some(c => c.value === 'A') && 
      uniqueValues.some(c => c.value === '2') &&
      uniqueValues.some(c => c.value === '3') &&
      uniqueValues.some(c => c.value === '4') &&
      uniqueValues.some(c => c.value === '5')) {
    return 5; // 5-high straight
  }
  
  // Check for normal straight
  for (let i = 0; i <= uniqueValues.length - 5; i++) {
    const highCard = cardValues[uniqueValues[i].value];
    if (
      cardValues[uniqueValues[i].value] === highCard &&
      cardValues[uniqueValues[i+1].value] === highCard - 1 &&
      cardValues[uniqueValues[i+2].value] === highCard - 2 &&
      cardValues[uniqueValues[i+3].value] === highCard - 3 &&
      cardValues[uniqueValues[i+4].value] === highCard - 4
    ) {
      return highCard;
    }
  }
  
  return false;
}

function isThreeOfAKind(cards) {
  const valueCounts = countValues(cards);
  for (const [value, count] of Object.entries(valueCounts)) {
    if (count === 3) return cardValues[value];
  }
  return false;
}

function isTwoPair(cards) {
  const valueCounts = countValues(cards);
  const pairs = [];
  
  for (const [value, count] of Object.entries(valueCounts)) {
    if (count === 2) pairs.push(cardValues[value]);
  }
  
  if (pairs.length >= 2) {
    pairs.sort((a, b) => b - a);
    return { high: pairs[0], low: pairs[1] };
  }
  
  return false;
}

function isPair(cards) {
  const valueCounts = countValues(cards);
  for (const [value, count] of Object.entries(valueCounts)) {
    if (count === 2) return cardValues[value];
  }
  return false;
}

function countValues(cards) {
  const valueCounts = {};
  for (const card of cards) {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  }
  return valueCounts;
}

function compareHands(hand1, hand2) {
  if (hand1.rank !== hand2.rank) {
    return hand1.rank - hand2.rank;
  }
  
  // Same rank, need tiebreakers
  switch (hand1.rank) {
    case 8: // Straight flush
    case 4: // Straight
      return hand1.highCard - hand2.highCard;
    
    case 7: // Four of a kind
    case 3: // Three of a kind
    case 1: // Pair
      return hand1.value - hand2.value;
    
    case 6: // Full house
      if (hand1.threeValue !== hand2.threeValue) {
        return hand1.threeValue - hand2.threeValue;
      }
      return hand1.pairValue - hand2.pairValue;
    
    case 5: // Flush
      for (let i = 0; i < 5; i++) {
        const card1Value = cardValues[hand1.cards[i].value];
        const card2Value = cardValues[hand2.cards[i].value];
        if (card1Value !== card2Value) {
          return card1Value - card2Value;
        }
      }
      return 0;
    
    case 2: // Two pair
      if (hand1.highPair !== hand2.highPair) {
        return hand1.highPair - hand2.highPair;
      }
      return hand1.lowPair - hand2.lowPair;
    
    case 0: // High card
      return hand1.value - hand2.value;
  }
  
  return 0;
}

// Fixed determineWinner function that uses player.hand instead of socket.handCards
const determineWinner = (lobby) => {
  // Only consider players who haven't folded
  const activePlayers = lobby.players.filter(player => !player.folded);
  const communityCards = lobby.communityCards;
  
  // If only one player remains (everyone else folded), they are the winner
  if (activePlayers.length === 1) {
    return activePlayers[0];
  }
  
  // Evaluate each active player's best hand
  const playerHands = activePlayers.map(player => {
    // Use the player.hand array stored in the player object
    // Combined with community cards
    const allCards = [...(player.hand || []), ...communityCards];
    
    if (allCards.length < 5) {
      return { player, handRank: { rank: -1 } };
    }
    
    // Get the best 5-card hand
    const handRank = getHandRank(allCards);
    return { player, handRank };
  });
  
  // Sort players by hand rank (highest first)
  playerHands.sort((a, b) => compareHands(b.handRank, a.handRank));
  
  // Return the player with the highest hand
  return playerHands[0].player;
};
