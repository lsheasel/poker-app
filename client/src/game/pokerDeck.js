// src/game/pokerDeck.js
export const createDeck = () => {
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
    let deck = [];
  
    suits.forEach(suit => {
      values.forEach(value => {
        deck.push({ value, suit });
      });
    });
  
    return deck;
  };
  
  export const shuffleDeck = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap
    }
    return deck;
  };
  