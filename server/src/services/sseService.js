const express = require('express');
const router = express.Router();

router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const gameId = req.query.gameId;
  const game = games.get(gameId);

  const sendUpdate = () => {
    res.write(`data: ${JSON.stringify(game)}\n\n`);
  };

  const interval = setInterval(sendUpdate, 1000);

  req.on('close', () => clearInterval(interval));
});

module.exports = router;