"use client";

import { useState, useEffect, useCallback } from "react";
import GridGame from "@/components/GridGame";
import CountdownTimer from "@/components/CountdownTimer";
import IsometricGrid from "@/components/IsometricGrid";
import InstructionsComponent from "@/components/InstructionsComponent";
import MouseFollower from "@/components/MouseFollower";
import { SwishSpinner } from "@/components/SwishSpinner";
import { useRemainingTime } from "@/hooks/useRemainingTime";
import { mockApi } from "@/lib/mockApi";
import { gameStateManager } from "@/lib/GameStateManager";
import {
  GameConfig,
  LevelStat,
  RoundSummary,
  GameSummary,
  Position,
} from "@/types/game";
import { calculateDisplayStats } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function DemoGamePage() {
  const { toast } = useToast();

  // Game state
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerAddress] = useState<string>(`demo_${Date.now()}`);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [levelEnded, setLevelEnded] = useState(false);
  const [roundComplete, setRoundComplete] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  // Level/Round tracking
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [levelStats, setLevelStats] = useState<LevelStat[]>([]);
  const [currentRoundStats, setCurrentRoundStats] =
    useState<RoundSummary | null>(null);
  const [finalGameStats, setFinalGameStats] = useState<GameSummary | null>(
    null,
  );

  // Mouse tracking
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Timer
  const { remainingTime, isExpired } = useRemainingTime(
    gameConfig?.startTime,
    gameConfig?.duration,
  );

  // Initialize game
  const initializeGame = async () => {
    try {
      setIsLoading(true);

      // Create game
      const { gameId: newGameId } = await mockApi.createGame(playerAddress);
      setGameId(newGameId);

      // Join game room (mock)
      mockApi.joinGameRoom(newGameId);

      // Setup listeners
      setupGameListeners(newGameId);

      // Subscribe to state changes
      mockApi.onGameStateChange((state, actions) => {
        gameStateManager.updateState(state, actions);
      });

      toast({
        title: "Game Created!",
        description: "Click 'Start Game' to begin",
      });
    } catch (error) {
      console.error("Failed to initialize game:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create game",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupGameListeners = (gameId: string) => {
    mockApi.setupLevelEndListener(gameId, (data) => {
      console.log("Level ended:", data);
      setLevelEnded(true);
      if (data.levelStat) {
        setLevelStats((prev) => [...prev, data.levelStat]);
      }
    });

    mockApi.setupRoundCompleteListener(gameId, (data) => {
      console.log("Round complete:", data);
      setRoundComplete(true);
      setCurrentRoundStats(data);
      setTotalScore(data.totalScore);
    });

    mockApi.setupGameCompleteListener(gameId, (data) => {
      console.log("Game complete:", data);
      setGameComplete(true);
      setFinalGameStats(data);
      setTotalScore(data.finalScore);
    });
  };

  const startGame = async () => {
    if (!gameId) return;

    try {
      setIsLoading(true);
      const config = await mockApi.startGame(playerAddress, gameId);
      setGameConfig(config);
      setGameStarted(true);
      setCurrentLevel(config.currentLevel || 1);
      setCurrentRound(config.currentRound || 1);

      toast({
        title: "Level Started!",
        description: `Round ${currentRound}, Level ${currentLevel}`,
      });
    } catch (error) {
      console.error("Failed to start game:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start game",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startNextLevel = async () => {
    if (!gameId) return;

    try {
      setIsLoading(true);
      setLevelEnded(false);
      setRoundComplete(false);

      const config = await mockApi.startLevel(playerAddress, gameId);
      setGameConfig(config);
      setCurrentLevel(config.currentLevel || currentLevel + 1);
      setCurrentRound(config.currentRound || currentRound);

      toast({
        title: "Next Level!",
        description: `Round ${config.currentRound}, Level ${config.currentLevel}`,
      });
    } catch (error) {
      console.error("Failed to start level:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start level",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCellReveal = async (position: Position) => {
    if (!gameId) return;

    try {
      await mockApi.clickCell(gameId, position, playerAddress);
    } catch (error) {
      console.error("Failed to click cell:", error);
    }
  };

  const handleEndLevel = async () => {
    if (!gameId) return;

    try {
      setIsLoading(true);
      await mockApi.endLevel(gameId, playerAddress);
    } catch (error) {
      console.error("Failed to end level:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end level",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndGame = async () => {
    if (!gameId) return;

    try {
      setIsLoading(true);
      await mockApi.endGame(gameId, playerAddress);
    } catch (error) {
      console.error("Failed to end game:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end game",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-end level when timer expires
  useEffect(() => {
    if (isExpired && gameStarted && !levelEnded) {
      handleEndLevel();
    }
  }, [isExpired]);

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeGame();

    return () => {
      if (gameId) {
        mockApi.cleanupGameListeners(gameId);
      }
    };
  }, []);

  if (isLoading && !gameConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#161525]">
        <SwishSpinner size={60} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#161525] text-white p-8">
      <MouseFollower x={mousePosition.x} y={mousePosition.y} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-[#6123ff] mb-2">
            Bug Hunter Demo
          </h1>
          <p className="text-gray-400">
            Find the hidden bugs before time runs out!
          </p>
        </div>

        {/* Game not started */}
        {!gameStarted && (
          <div className="flex flex-col items-center justify-center space-y-8">
            <InstructionsComponent />
            <button
              onClick={startGame}
              disabled={!gameId || isLoading}
              className="px-8 py-4 bg-[#6123ff] hover:bg-[#5cffb1] text-white font-bold text-xl rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "Start Game"}
            </button>
          </div>
        )}

        {/* Game in progress */}
        {gameStarted && !levelEnded && !gameComplete && gameConfig && (
          <div className="space-y-8">
            {/* Game info */}
            <div className="flex justify-between items-center">
              <div className="text-xl">
                <span className="text-[#5cffb1]">Round {currentRound}</span>
                <span className="text-gray-400 mx-2">•</span>
                <span className="text-[#5cffb1]">Level {currentLevel}</span>
              </div>
              <div className="text-xl">
                <span className="text-gray-400">Score: </span>
                <span className="text-[#6123ff] font-bold">{totalScore}</span>
              </div>
            </div>

            {/* Timer */}
            <div className="flex justify-center">
              <CountdownTimer
                remainingTime={remainingTime}
                onTimerEnd={handleEndLevel}
                isRunning={!isExpired}
              />
            </div>

            {/* Grid */}
            <div className="flex justify-center items-center relative">
              <div className="relative">
                <IsometricGrid
                  gridSize={gameConfig.gridSize}
                  squareSize={50}
                  startTime={gameConfig.startTime}
                  totalTime={gameConfig.duration}
                  remainingTime={remainingTime}
                  updateInterval={5}
                  className=""
                />
                <div className="absolute top-0 left-0">
                  <GridGame
                    gridSize={gameConfig.gridSize}
                    onCellReveal={handleCellReveal}
                    enemyPositions={gameConfig.bugs}
                    gameId={gameId!}
                    address={playerAddress}
                  />
                </div>
              </div>
            </div>

            {/* Verify button */}
            <div className="flex justify-center">
              <button
                onClick={handleEndLevel}
                disabled={isLoading}
                className="px-6 py-3 bg-[#f72585] hover:bg-[#b5179e] text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify Guess"}
              </button>
            </div>
          </div>
        )}

        {/* Level ended */}
        {levelEnded && !roundComplete && !gameComplete && (
          <div className="flex flex-col items-center justify-center space-y-6">
            <h2 className="text-3xl font-bold text-[#5cffb1]">
              Level Complete!
            </h2>
            {levelStats.length > 0 && (
              <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
                <div className="space-y-2 text-lg">
                  <p>
                    Bugs Found:{" "}
                    <span className="text-[#5cffb1] font-bold">
                      {levelStats[levelStats.length - 1].bugsFound} /{" "}
                      {levelStats[levelStats.length - 1].totalBugs}
                    </span>
                  </p>
                  <p>
                    Score:{" "}
                    <span className="text-[#6123ff] font-bold">
                      {levelStats[levelStats.length - 1].score}
                    </span>
                  </p>
                </div>
              </div>
            )}
            <div className="flex space-x-4">
              <button
                onClick={startNextLevel}
                disabled={isLoading}
                className="px-8 py-4 bg-[#6123ff] hover:bg-[#5cffb1] text-white font-bold text-xl rounded-lg transition-colors"
              >
                Next Level
              </button>
              <button
                onClick={handleEndGame}
                disabled={isLoading}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl rounded-lg transition-colors"
              >
                End Game
              </button>
            </div>
          </div>
        )}

        {/* Round complete */}
        {roundComplete && !gameComplete && currentRoundStats && (
          <div className="flex flex-col items-center justify-center space-y-6">
            <h2 className="text-4xl font-bold text-[#f72585]">
              Round {currentRound - 1} Complete! 🎉
            </h2>
            <div className="bg-gray-800 p-8 rounded-lg max-w-2xl w-full">
              <div className="space-y-4">
                <div className="text-2xl text-center">
                  <p className="text-gray-400">Round Score</p>
                  <p className="text-[#6123ff] font-bold text-4xl">
                    {currentRoundStats.roundStats.totalScore}
                  </p>
                </div>
                <div className="text-2xl text-center">
                  <p className="text-gray-400">Total Score</p>
                  <p className="text-[#5cffb1] font-bold text-4xl">
                    {currentRoundStats.totalScore}
                  </p>
                </div>
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <h3 className="text-xl font-bold mb-3">Level Stats:</h3>
                  <div className="space-y-2">
                    {currentRoundStats.roundStats.levels.map((level, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-gray-700 p-3 rounded"
                      >
                        <span>Level {level.level}</span>
                        <div className="text-right">
                          <div className="text-[#5cffb1]">
                            {level.bugsFound}/{level.totalBugs} bugs
                          </div>
                          <div className="text-[#6123ff] font-bold">
                            {level.score} pts
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={startNextLevel}
                disabled={isLoading}
                className="px-8 py-4 bg-[#6123ff] hover:bg-[#5cffb1] text-white font-bold text-xl rounded-lg transition-colors"
              >
                Start Round {currentRoundStats.nextRound}
              </button>
              <button
                onClick={handleEndGame}
                disabled={isLoading}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl rounded-lg transition-colors"
              >
                End Game
              </button>
            </div>
          </div>
        )}

        {/* Game complete */}
        {gameComplete && finalGameStats && (
          <div className="flex flex-col items-center justify-center space-y-8">
            <h2 className="text-5xl font-bold text-[#f72585]">
              Game Complete! 🏆
            </h2>
            <div className="bg-gray-800 p-8 rounded-lg max-w-2xl w-full">
              <div className="text-center mb-6">
                <p className="text-gray-400 text-xl mb-2">Final Score</p>
                <p className="text-[#6123ff] font-bold text-6xl">
                  {finalGameStats.finalScore}
                </p>
              </div>

              {finalGameStats.gameStats.length > 0 && (
                <>
                  <div className="text-center mb-6">
                    {(() => {
                      const { totalScore, accuracy } = calculateDisplayStats(
                        finalGameStats.finalScore,
                        finalGameStats.gameStats,
                      );
                      return (
                        <div>
                          <p className="text-gray-400 text-lg">
                            Overall Accuracy
                          </p>
                          <p className="text-[#5cffb1] font-bold text-3xl">
                            {accuracy}%
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="border-t border-gray-700 pt-6">
                    <h3 className="text-xl font-bold mb-4">All Levels:</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {finalGameStats.gameStats.map((level, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-gray-700 p-3 rounded"
                        >
                          <span>Level {level.level}</span>
                          <div className="text-right">
                            <div className="text-[#5cffb1]">
                              {level.bugsFound}/{level.totalBugs} bugs
                            </div>
                            <div className="text-[#6123ff] font-bold">
                              {level.score} pts
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-[#6123ff] hover:bg-[#5cffb1] text-white font-bold text-xl rounded-lg transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
