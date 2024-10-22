// lib/mockGameState.ts

import { useState, useCallback } from "react";

interface GameState {
  gridSize: number;
  gameStarted: boolean;
  gameEnded: boolean;
  score: number;
  initialTime: number;
  enemyPositions: { x: number; y: number }[];
  revealedCells: Set<string>;
}

const initialEnemyPositions = [
  { x: 2, y: 7 },
  { x: 9, y: 0 },
  { x: 5, y: 3 },
  { x: 0, y: 9 },
  { x: 7, y: 6 },
  { x: 4, y: 2 },
  { x: 1, y: 5 },
  { x: 8, y: 8 },
  { x: 3, y: 1 },
  { x: 6, y: 4 },
];

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    gridSize: 10,
    gameStarted: false,
    gameEnded: false,
    score: 0,
    initialTime: 600,
    enemyPositions: initialEnemyPositions,
    revealedCells: new Set(),
  });

  const startGame = useCallback(() => {
    setGameState((prevState) => ({
      ...prevState,
      gameStarted: true,
      gameEnded: false,
      score: 0,
      revealedCells: new Set(),
    }));
  }, []);

  const endGame = useCallback(() => {
    setGameState((prevState) => ({
      ...prevState,
      gameStarted: false,
      gameEnded: true,
    }));
  }, []);

  const handleCellReveal = useCallback(() => {
    setGameState((prevState) => ({
      ...prevState,
      score: prevState.score + 1,
    }));
  }, []);

  const setGridSize = useCallback((size: number) => {
    setGameState((prevState) => ({
      ...prevState,
      gridSize: size,
    }));
  }, []);

  return {
    gameState,
    startGame,
    endGame,
    handleCellReveal,
    setGridSize,
  };
}
