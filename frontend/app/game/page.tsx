// app/game/page.tsx

"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import CountdownTimer from "../components/CountdownTimer";
import GridGame from "../components/GridGame";
import IsometricGrid from "../components/IsometricGrid";
import { useGameState } from "../../lib/mockGameState";
import Image from "next/image";
import heroImage from "../../public/hero-logo.png";

export default function GamePage() {
  const { gameState, startGame, endGame, handleCellReveal, setGridSize } =
    useGameState();

  return (
    <main className="flex flex-col items-center justify-center">
        <div className="w-full p-4 flex justify-end">
            <ConnectButton />
        </div> 
          {!gameState.gameStarted && (
        <>
          <Image
            src={heroImage}
            placeholder="blur"
            className="logo p-4 max-h-96 my-32 cursor-default"
            style={{ objectFit: "contain" }}
            alt="Blockchain Gods logo"
          />
          <h1 className="text-4xl font-bold mb-8">Block-Nonce Game</h1>
          <button onClick={startGame} className="pulse-button">
            Start Game
          </button>
        </>
      )}

      {gameState.gameStarted && (
        <>
          
          <IsometricGrid
            gridSize={10}
            squareSize={35}
            initialTime={gameState.initialTime}
            updateInterval={2}
            isRunning={gameState.gameStarted}
          />
          <CountdownTimer
            initialTime={gameState.initialTime}
            onTimerEnd={endGame}
            isRunning={gameState.gameStarted}
          />
          {/* <div className="mb-4">
            <label htmlFor="gridSize" className="mr-2">
              Grid Size:
            </label>
            <input
              type="number"
              id="gridSize"
              value={gameState.gridSize}
              onChange={(e) =>
                setGridSize(
                  Math.max(2, Math.min(20, parseInt(e.target.value) || 10))
                )
              }
              className="border rounded px-2 py-1"
              min="2"
              max="20"
            />
          </div> */}
          <div className="mb-4">Score: {gameState.score}</div>
          <GridGame
            gridSize={gameState.gridSize}
            onCellReveal={handleCellReveal}
            enemyPositions={gameState.enemyPositions}
          />
        </>
      )}

      {gameState.gameEnded && (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
          <p className="mb-4">Your final score: {gameState.score}</p>
          <button onClick={startGame} className="pulse-button">
            Play Again
          </button>
        </div>
      )}
    </main>
  );
}
