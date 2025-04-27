import { createSlice } from '@reduxjs/toolkit';

const gameSlice = createSlice({
  name: 'game',
  initialState: {
    gameId: null,
    players: [],
    cards: [],
    status: 'waiting'
  },
  reducers: {
    setGameState(state, action) {
      return { ...state, ...action.payload };
    }
  }
});

export const { setGameState } = gameSlice.actions;
export default gameSlice.reducer;