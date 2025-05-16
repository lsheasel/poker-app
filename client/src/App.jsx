import React, { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import PokerGame from './components/PokerGame';
import socket from './socket';
import { supabase } from './supabaseClient';
import ProfileButton from './components/Profile';
import { UserAuth } from "./context/AuthContext";



const App = () => {
  const { user } = UserAuth();
  const [gameState, setGameState] = useState({
    isPlaying: false,
    lobbyName: '',
    playerName: '',
    avatar_url: '',
    playerId: '',
    isHost: false,
    playerHand: [],
    communityCards: [],
    pot: 0,
    playerMoney: 1000,
    gameStarted: false,
    playerTurn: false
  });

  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const [gamePlayers, setGamePlayers] = useState([]);

  useEffect(() => {
    const handleDealCards = (data) => {
      if (data.hand && Array.isArray(data.hand)) {
        setGameState(prev => ({
          ...prev,
          playerHand: data.hand,
          gameStarted: true,
          playerTurn: data.isCurrentPlayer
        }));
      }
    };

    const handleUpdatePot = (data) => {
      setGameState(prev => ({
        ...prev,
        pot: data.pot
      }));
    };

    socket.on("dealCards", handleDealCards);
    socket.on("updatePot", handleUpdatePot);

    return () => {
      socket.off("dealCards", handleDealCards);
      socket.off("updatePot", handleUpdatePot);
    };
  }, []);

  useEffect(() => {
    socket.on("updatePot", ({ pot }) => {
      setGameState(prev => ({ ...prev, pot }));
    });
    socket.on("updatePlayerChips", ({ playerId, chips }) => {
      if (playerId === gameState.playerId) {
        setGameState(prev => ({ ...prev, playerMoney: chips }));
      }
    });
    return () => {
      socket.off("updatePot");
      socket.off("updatePlayerChips");
    };
  }, [gameState.playerId]);

  useEffect(() => {
    socket.on("currentPlayer", ({ playerId }) => {
      setCurrentPlayerId(playerId);
    });
    return () => socket.off("currentPlayer");
  }, []);
  useEffect(() => {
    socket.on("avatar_url", ({ avatar_url }) => {
      setCurrentPlayerId(avatar_url);
    });
    return () => socket.off("avatar_url");
  }, []);

  useEffect(() => {
    socket.on("communityCards", ({ cards }) => {
      setGameState(prev => ({ ...prev, communityCards: cards }));
    });
    return () => socket.off("communityCards");
  }, []);

  useEffect(() => {
    const handleUpdatePlayers = (players) => {
      setGamePlayers(players);
    };
    socket.on("updatePlayers", handleUpdatePlayers);
    return () => socket.off("updatePlayers", handleUpdatePlayers);
  }, []);

  const handleGameStart = (gameInfo) => {
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      lobbyName: gameInfo.lobbyName,
      playerName: gameInfo.playerName,
      avatar_url: gameInfo.avatar_url,
      playerId: socket.id, // <--- eigene Socket-ID!
      isHost: gameInfo.isHost
    }));
  };

  const handleBet = (amount) => {
    if (!amount || amount <= 0) return;
    socket.emit("bet", { lobbyName: gameState.lobbyName, amount });
  };

  const handleCall = () => {
    socket.emit("call", { lobbyName: gameState.lobbyName });
  };

  const handleFold = () => {
    socket.emit("fold", { lobbyName: gameState.lobbyName });
  };

  return (
    <div>
      {!gameState.isPlaying ? (
        <Lobby onStartGame={handleGameStart} />
      ) : (
        <PokerGame 
          players={gamePlayers}
          avatar_url={gameState.avatar_url}
          lobbyName={gameState.lobbyName}
          playerName={gameState.playerName}
          playerId={gameState.playerId}
          isHost={gameState.isHost}
          playerHand={gameState.playerHand}
          communityCards={gameState.communityCards}
          pot={gameState.pot}
          playerMoney={gameState.playerMoney}
          gameStarted={gameState.gameStarted}
          playerTurn={gameState.playerTurn}
          currentPlayerId={currentPlayerId}
          myPlayerId={gameState.playerId}
          onBet={handleBet}
          onCall={handleCall}
          onFold={handleFold}
        />
      )}
    </div>
  );
};

export default App;