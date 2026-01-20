"use client";

import CountdownTimer from "@/components/CountdownTimer";
import GridGame from "@/components/GridGame";
import { useParams, useRouter } from "next/navigation";
import { useRemainingTime } from "@/hooks/useRemainingTime";
import { LoadingComponent } from "@/components/LoadingComponent";
import { useEffect, useState, useRef } from "react";
import {
  GameSummary,
  LevelStat,
  Position,
  RoundSummary,
  GameConfig,
} from "@/types/game";
import { useToast } from "@/hooks/use-toast";
import { mockApi } from "@/lib/mockApi";
import IsometricGrid from "@/components/IsometricGrid";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SwishSpinner } from "@/components/SwishSpinner";
import { calculateDisplayStats } from "@/lib/utils";
import { gameStateManager } from "@/lib/GameStateManager";

export default function DemoGamePage() {
  const router = useRouter();
  const { toast } = useToast();
  const initializingRef = useRef(false);
  const initializedRef = useRef(false);

  // Player setup
  const [playerIdentifier] = useState<string>(`demo_${Date.now()}`);
  const [gameId, setGameId] = useState<string | null>(null);

  // Basic State
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [resultBugs, setResultBugs] = useState(0);
  const [verificationInProg, setVerificationInProg] = useState(false);
  const [proofIsVerified, setProofIsVerified] = useState(true);
  const [endType, setEndType] = useState("manual");
  const [isFullVerifying, setIsFullVerifying] = useState(false);
  const [fullVerificationResult, setFullVerificationResult] = useState<{
    success?: boolean;
    onChainVerified?: boolean;
    contractTxHash?: string;
  } | null>(null);
  const [isEnding, setIsEnding] = useState(false);

  // Game State Management
  const [currentGameState, setCurrentGameState] = useState<string | null>(null);
  const [validActions, setValidActions] = useState<string[]>([]);
  const [showLevelSummary, setShowLevelSummary] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [levelStats, setLevelStats] = useState<LevelStat>();
  const [roundStats, setRoundStats] = useState<{
    totalScore: number;
    accuracy: number;
  }>();
  const [roundHasEnded, setRoundHasEnded] = useState(false);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [gameHasEnded, setGameHasEnded] = useState(false);

  // Game config
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Game state polling simulation
  const [gameState, setGameState] = useState<{
    currentRound: number;
    currentLevel: number;
    isEnded: boolean;
    totalScore: number;
  } | null>(null);

  const remainingTime = useRemainingTime(
    gameConfig?.startTime,
    gameConfig?.duration,
  );

  // Initialize game on mount
  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (initializingRef.current || initializedRef.current) {
      console.log("[DemoGamePage] Skipping duplicate initialization");
      return;
    }

    initializingRef.current = true;

    const initializeGame = async () => {
      try {
        setIsLoading(true);

        console.log("[DemoGamePage] Starting initialization...");

        // Subscribe to state changes first
        mockApi.onGameStateChange((state, actions) => {
          console.log("[DemoGamePage] State changed to:", state);
          setCurrentGameState(state);
          setValidActions(actions);
          gameStateManager.updateState(state, actions);

          if (state === "LEVEL_ENDED") {
            setShowLevelSummary(true);
          } else if (state === "ROUND_COMPLETE") {
            setRoundHasEnded(true);
            setShowRoundSummary(true);
          }
        });

        // Create game
        console.log(
          "[DemoGamePage] Creating game for player:",
          playerIdentifier,
        );
        const { gameId: newGameId } =
          await mockApi.createGame(playerIdentifier);
        console.log("[DemoGamePage] Game created with ID:", newGameId);
        setGameId(newGameId);

        // Setup listeners after game is created
        setupGameListeners(newGameId);

        // Small delay to ensure game is ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Start the first level automatically
        console.log("[DemoGamePage] Starting game...");
        const config = await mockApi.startGame(playerIdentifier, newGameId);
        console.log("[DemoGamePage] Game started with config:", config);

        setGameConfig(config);
        setCurrentLevel(config.currentLevel || 1);
        setCurrentRound(config.currentRound || 1);
        setGameState({
          currentRound: config.currentRound || 1,
          currentLevel: config.currentLevel || 1,
          isEnded: false,
          totalScore: 0,
        });

        initializedRef.current = true;

        toast({
          title: "Demo Started!",
          description: `Epoch ${config.currentRound}, Block ${config.currentLevel}`,
        });
      } catch (error: any) {
        console.error("Failed to initialize game:", error);
        setInitError(error.message || "Failed to create game");
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to create game",
        });
      } finally {
        setIsLoading(false);
        initializingRef.current = false;
      }
    };

    initializeGame();

    return () => {
      if (gameId && !initializedRef.current) {
        mockApi.cleanupGameListeners(gameId);
      }
    };
  }, []);

  // Stats fetching
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await mockApi.getPlayerStats(playerIdentifier);
        setGamesPlayed(stats.gamesPlayed);
      } catch (err) {
        console.error(err);
      }
    };

    if (playerIdentifier) {
      fetchStats();
    }
  }, [playerIdentifier]);

  const setupGameListeners = (gameId: string) => {
    mockApi.setupLevelEndListener(gameId, async (data) => {
      const { state, validActions, isRoundComplete, isGameComplete } = data;

      if (isGameComplete) {
        setShowLevelSummary(true);
        setShowRoundSummary(true);
        setGameHasEnded(true);
      } else if (isRoundComplete) {
        setShowRoundSummary(true);
        setShowLevelSummary(true);
      } else {
        setShowLevelSummary(true);
      }

      // Additional state handling based on the response
      if (data.result) {
        setLevelStats(data.result);
      }
    });

    mockApi.setupRoundCompleteListener(gameId, (data: RoundSummary) => {
      setShowLevelSummary(true);
      setShowRoundSummary(true);

      const displayStats = calculateDisplayStats(
        data.totalScore,
        data.roundStats.levels,
      );
      setRoundStats(displayStats);

      // Update game state
      setGameState((prev) => ({
        ...prev!,
        currentRound: data.nextRound,
        totalScore: data.totalScore,
      }));
    });

    mockApi.setupGameCompleteListener(gameId, (data: GameSummary) => {
      setShowLevelSummary(true);
      setShowRoundSummary(true);

      const displayStats = calculateDisplayStats(
        data.finalScore,
        data.gameStats,
      );

      setGameHasEnded(true);
      setRoundStats(displayStats);

      // Update game state
      setGameState((prev) => ({
        ...prev!,
        isEnded: true,
        totalScore: data.finalScore,
      }));
    });
  };

  const handleEndLevel = async () => {
    if (!playerIdentifier || !gameId) return;

    if (!validActions.includes("endLevel")) {
      toast({
        variant: "destructive",
        title: "Invalid Action",
        description: "Cannot end level in current state",
      });
      return;
    }

    try {
      setIsEnding(true);
      setEndType("manual");
      await mockApi.endLevel(gameId, playerIdentifier);
    } catch (error) {
      console.error("Failed to end level:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end level",
      });
    } finally {
      setIsEnding(false);
    }
  };

  const handleCellReveal = async (position: Position) => {
    if (!gameId) return;

    try {
      await mockApi.clickCell(gameId, position, playerIdentifier);
    } catch (error) {
      console.error("Failed to click cell:", error);
    }
  };

  const handleContinueToNextLevel = async () => {
    if (!gameId) return;

    try {
      setIsLoading(true);
      setShowLevelSummary(false);
      setShowRoundSummary(false);
      setRoundHasEnded(false);

      const config = await mockApi.startLevel(playerIdentifier, gameId);
      setGameConfig(config);
      setCurrentLevel(config.currentLevel || currentLevel + 1);
      setCurrentRound(config.currentRound || currentRound);

      // Update game state
      setGameState((prev) => ({
        ...prev!,
        currentLevel: config.currentLevel || currentLevel + 1,
        currentRound: config.currentRound || currentRound,
        isEnded: false,
      }));

      toast({
        title: "Next Block!",
        description: `Epoch ${config.currentRound}, Block ${config.currentLevel}`,
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

  const handleContinueToNextRound = async () => {
    if (!gameId) return;

    try {
      setIsLoading(true);
      setShowLevelSummary(false);
      setShowRoundSummary(false);
      setRoundHasEnded(false);

      const config = await mockApi.startLevel(playerIdentifier, gameId);
      setGameConfig(config);
      setCurrentLevel(config.currentLevel || 1);
      setCurrentRound(config.currentRound || currentRound + 1);

      // Update game state
      setGameState((prev) => ({
        ...prev!,
        currentLevel: config.currentLevel || 1,
        currentRound: config.currentRound || currentRound + 1,
        isEnded: false,
      }));

      toast({
        title: "Next Epoch!",
        description: `Epoch ${config.currentRound}, Block ${config.currentLevel}`,
      });
    } catch (error) {
      console.error("Failed to start round:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start round",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartGame = () => {
    // Clear localStorage
    localStorage.removeItem("demo_current_game");

    // Reload the page
    window.location.reload();
  };

  const handleFullVerification = async () => {
    // Mock full verification (disabled in demo)
    toast({
      title: "Demo Mode",
      description: "On-chain verification is not available in demo mode",
    });
  };

  // Auto-end level when timer expires
  useEffect(() => {
    if (remainingTime.isExpired && gameConfig && !showLevelSummary) {
      setEndType("timeout");
      handleEndLevel();
    }
  }, [remainingTime.isExpired]);

  // Loading state
  if (isLoading && !gameConfig) {
    return <LoadingComponent />;
  }

  // Error state
  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{initError}</p>
        <button
          onClick={() => (window.location.href = "/")}
          className="px-4 py-2 btn-primary"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center">
      <div className="w-full p-4 flex justify-between items-center">
        <div className="text-[#6123ff] font-bold">
          🎮 DEMO MODE - No Wallet Required
        </div>
      </div>

      {/* Game Content */}
      {gameConfig && (
        <div className="relative">
          <div className="w-max flex gap-4 absolute left-[146px] top-[6px]">
            <div className="text-center text-4xl text-[#6123ff] flex flex-col">
              <p className="text-xs leading-none">Epoch:</p>
              <p className="font-bold leading-none">
                {gameState?.currentRound}
              </p>
            </div>
            <div className="border border-[#6123ff]"></div>
            <div className="text-center text-4xl text-[#6123ff] flex flex-col">
              <p className="text-xs leading-none">Block No.:</p>
              <p className="font-bold leading-none">
                {gameState?.currentLevel}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-max flex flex-col gap-24 absolute right-[350px] -bottom-[133px] z-10">
            <button
              onClick={handleEndLevel}
              disabled={isEnding || isLoading}
              className="px-6 py-2  text-[#6123ff] font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEnding ? "Ending..." : "Next Block ›"}
            </button>
            <button
              onClick={handleRestartGame}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
            >
              Restart Game
            </button>
          </div>

          <CountdownTimer
            remainingTime={remainingTime.remainingTime}
            onTimerEnd={() => {}}
            isRunning={gameState ? !gameState.isEnded : false}
          />

          <IsometricGrid
            gridSize={7}
            squareSize={26}
            startTime={gameConfig.startTime}
            totalTime={gameConfig.duration}
            remainingTime={remainingTime.remainingTime}
            updateInterval={1}
            className=""
          />
          <div className="bg-[url('/grid-bg.png')] bg-contain bg-center bg-no-repeat px-20 pt-32 pb-20">
            <GridGame
              gridSize={gameConfig.gridSize}
              onCellReveal={handleCellReveal}
              enemyPositions={gameConfig.bugs}
              gameId={gameId!}
              address={playerIdentifier}
              levelKey={`${currentRound}-${currentLevel}`}
            />
          </div>
        </div>
      )}

      {/* Level End Dialog */}
      <AlertDialog open={showLevelSummary}>
        <AlertDialogContent className="bg-[#161525] border-2 border-[#5b23d4] w-1/3">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold mb-4 flex justify-center">
              {endType === "manual" ? "Level ended" : "Time's up!"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-lg text-center">
              <span className=" my-2">
                You found{" "}
                <span className="text-[#5cffb1]">
                  {levelStats?.bugsFound || 0}{" "}
                  {levelStats?.bugsFound === 1 ? " bug" : " bugs"}
                </span>
              </span>
              <br />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-center border-t pt-5">
            {showRoundSummary && (
              <>
                <h2 className="text-2xl font-bold mb-4 ">Epoch Stats</h2>
                <div>
                  <span>
                    Total Score:{" "}
                    <span className="text-[#5cffb1] font-bold">
                      {JSON.stringify(roundStats?.totalScore)}
                    </span>
                  </span>
                  <br />
                  <span>
                    Accuracy:{" "}
                    <span className="text-[#5cffb1] font-bold">
                      {JSON.stringify(roundStats?.accuracy)}
                    </span>
                  </span>
                </div>
                {verificationInProg ? (
                  <>
                    <span>Verifying locally...</span>

                    <SwishSpinner />
                  </>
                ) : proofIsVerified ? (
                  <>
                    {!isFullVerifying && !fullVerificationResult && (
                      <div className="mt-4">
                        <button
                          onClick={handleFullVerification}
                          className="bg-[#5b23d4]/50 text-white/50 inset-0  transition-colors rounded-md text-sm font-medium h-10 px-4 py-2"
                          disabled
                        >
                          Verify On-Chain*
                        </button>
                        <p className="text-xs py-2">
                          *Not available in demo mode
                        </p>
                      </div>
                    )}

                    {isFullVerifying && (
                      <>
                        <div className="mt-2">Verifying on-chain...</div>
                        <SwishSpinner />
                      </>
                    )}
                    {fullVerificationResult && (
                      <div className="mt-2">
                        {fullVerificationResult.success ? (
                          <span className="text-[#5cffb1]">
                            Verified on-chain successfully!
                          </span>
                        ) : (
                          <span className="text-[#ff006e]">
                            On-chain verification failed
                          </span>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-[#ff006e]">
                    You didn't get all the bugs :(
                  </span>
                )}
              </>
            )}
          </div>
          {roundHasEnded ? (
            <>
              <AlertDialogFooter className="m-auto">
                <AlertDialogAction
                  className="bg-[#beb8db] text-[#5b23d4] hover:bg-transparent hover:border hover:border-[#5b23d4]"
                  onClick={() => {
                    if (gameHasEnded) {
                      router.push("/");
                    } else {
                      handleContinueToNextRound();
                    }
                  }}
                  disabled={verificationInProg || isFullVerifying}
                >
                  {isLoading
                    ? "Starting..."
                    : gameHasEnded
                      ? "Back to Home"
                      : "Next Epoch ›"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <AlertDialogFooter className="m-auto">
              <AlertDialogAction
                className="bg-[#beb8db] text-[#5b23d4] hover:bg-transparent hover:border hover:border-[#5b23d4]"
                onClick={() => {
                  if (gameHasEnded) {
                    router.push("/");
                  } else {
                    handleContinueToNextLevel();
                  }
                }}
                disabled={verificationInProg || isFullVerifying}
              >
                {isLoading
                  ? "Starting..."
                  : gameHasEnded
                    ? "Back to Home"
                    : "Next Block ›"}
              </AlertDialogAction>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
