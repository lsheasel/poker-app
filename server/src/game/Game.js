class Game {
  constructor(id) {
    this.id = id;
    this.players = [];
    this.deck = [];
    this.status = 'waiting';
    this.lastUpdate = Date.now();
  }

  addPlayer(player) {
    this.players.push(player);
    this.lastUpdate = Date.now();
  }

  // ... game methods
}

module.exports = Game;