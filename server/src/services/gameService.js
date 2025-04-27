const express = require('express');
const router = express.Router();
const Game = require('../game/Game');

const games = new Map();

router.post('/games', (req, res) => {
  const game = new Game(Date.now().toString());
  games.set(game.id, game);
  res.json({ gameId: game.id });
});

router.get('/games/:id', (req, res) => {
  const game = games.get(req.params.id);
  if (!game) return res.status(404).send('Game not found');
  res.json(game);
});

module.exports = router;