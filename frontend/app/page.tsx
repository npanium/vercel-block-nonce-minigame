"use client";
import React, { useState, useCallback } from "react";
import CountdownTimer from "./components/CountdownTimer";
import GridGame from "./components/GridGame";
import Image from "next/image";
import heroImage from "../public/hero-logo.png";
import IsometricGrid from "./components/IsometricGrid";

export default function Home() {
  const [gridSize, setGridSize] = useState(10);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [score, setScore] = useState(0);
  const [initialTime, setInitialTime] = useState(600);

  const enemyPositions = [
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

  const startGame = () => {
    setGameStarted(true);
    setGameEnded(false);
    setScore(0);
  };

  const endGame = () => {
    setGameEnded(true);
    setGameStarted(false);
  };

  const handleCellReveal = useCallback(() => {
    setScore((prevScore) => prevScore + 1);
  }, []);

  return (
    <main className="flex flex-col items-center justify-center">
      {!gameStarted && (
        <>
          {" "}
          <Image
            src={heroImage}
            placeholder="blur"
            className="logo p-4 max-h-96 my-32 cursor-default"
            style={{ objectFit: "contain" }}
            alt="Blockchain Gods logo"
          />
          <h1 className="text-4xl font-bold mb-8">Block-Nonce Game</h1>
        </>
      )}

      {!gameStarted && !gameEnded && (
        <button onClick={startGame} className="btn-primary">
          Start Game
        </button>
      )}

      {gameStarted && (
        <>
          {" "}
          <IsometricGrid
            gridSize={10}
            squareSize={35}
            initialTime={initialTime}
            updateInterval={2}
            isRunning={gameStarted}
          />
          <CountdownTimer
            initialTime={initialTime}
            onTimerEnd={endGame}
            isRunning={gameStarted}
          />
          <div className="mb-4">
            <label htmlFor="gridSize" className="mr-2">
              Grid Size:
            </label>
            <input
              type="number"
              id="gridSize"
              value={gridSize}
              onChange={(e) =>
                setGridSize(
                  Math.max(2, Math.min(20, parseInt(e.target.value) || 10))
                )
              }
              className="border rounded px-2 py-1"
              min="2"
              max="20"
            />
          </div>
          <div className="mb-4">Score: {score}</div>
          <GridGame
            gridSize={gridSize}
            onCellReveal={handleCellReveal}
            enemyPositions={enemyPositions}
          />
        </>
      )}

      {gameEnded && (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
          <p className="mb-4">Your final score: {score}</p>
          <button onClick={startGame} className="btn-primary">
            Play Again
          </button>
        </div>
      )}
    </main>
  );
}
