// src/game/pokerGame.js
import { createDeck, shuffleDeck } from './pokerDeck';

export const dealCards = (numPlayers) => {
  let deck = createDeck();
  deck = shuffleDeck(deck);

  const hands = [];
  for (let i = 0; i < numPlayers; i++) {
    hands.push([deck.pop(), deck.pop()]); // Jedes Spieler bekommt 2 Karten
  }

  return hands;
};

export const playerAction = (action) => {
  if (action === 'check') {
    console.log("Player checks");
  } else if (action === 'fold') {
    console.log("Player folds");
  } else {
    console.log("Invalid action");
  }
};
