"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import CountdownTimer from "@/components/CountdownTimer";
import GridGame from "@/components/GridGame";
import { useAccount } from "wagmi";
import { useParams } from "next/navigation";
import { useGameInitialization } from "@/hooks/useGameInitialization";
import { useGameStatePolling } from "@/hooks/useGameStatePolling";
import { useRemainingTime } from "@/hooks/useRemainingTime";
import { LoadingComponent } from "@/components/LoadingComponent";
import { useEffect, useState } from "react";
import { Position } from "@/types/game";
import { useToast } from "@/hooks/use-toast";
import {
  cleanupGameListeners,
  clickCell,
  endGame,
  endGameWithFullVerification,
  getPlayerStats,
  initializeSocket,
  setupGameEndListener,
} from "@/lib/api";
import IsometricGrid from "@/components/IsometricGrid";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useGameCreation } from "@/hooks/useGameCreation";
import { SwishSpinner } from "@/components/SwishSpinner";

export default function GamePage() {
  const { startNewGame, isLoading } = useGameCreation();
  const { gameId } = useParams() as { gameId: string };
  const { address } = useAccount();
  const { toast } = useToast();
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [resultBugs, setResultBugs] = useState(0);
  const [verificationInProg, setVerificationInProg] = useState(false);
  const [proofIsVerified, setProofIsVerified] = useState(false);
  const [endType, setEndType] = useState("manual");
  const [isFullVerifying, setIsFullVerifying] = useState(false);
  const [fullVerificationResult, setFullVerificationResult] = useState<{
    success?: boolean;
    onChainVerified?: boolean;
    contractTxHash?: string;
  } | null>(null);

  const [isEnding, setIsEnding] = useState(false);

  // Initialize game and get configuration
  const {
    gameConfig,
    error: initError,
    initializeGame,
  } = useGameInitialization(address!, gameId);

  // Poll game state
  const { gameState, isRunning } = useGameStatePolling(address!, gameId);

  // Calculate remaining time
  const remainingTime = useRemainingTime(
    gameConfig?.startTime,
    gameConfig?.duration
  );

  // Initialize game on mount
  useEffect(() => {
    if (address) {
      initializeGame();
    }
  }, [address]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getPlayerStats(address!.toString());
        console.log(`Stats: ${JSON.stringify(stats)}`);
        setGamesPlayed(stats.gamesPlayed);
      } catch (err) {
        console.error(err);
      }
    };

    if (address) {
      fetchStats();
    }
  }, [address, gameId]);

  useEffect(() => {
    // Initialize socket connection
    const socket = initializeSocket();

    // Setup game end listener
    setupGameEndListener(gameId, (data) => {
      if (data.result.endType === "timeout") {
        console.log("Game ended due to timeout");
      } else {
        console.log("Game ended manually");
      }

      console.log(`Found ${data.result.bugsFound} bugs`);
      console.log(`Data from FE: ${JSON.stringify(data)}`);
      setVerificationInProg(data.result.verificationInProgress);
      setEndType(data.result.endType);
      setProofIsVerified(data.result.proofVerified);
      setResultBugs(data.result.bugsFound);
    });

    // Cleanup on component unmount
    return () => {
      cleanupGameListeners(gameId);
    };
  }, [gameId]);

  const handleEndGame = async () => {
    if (!address || !gameId) return;

    try {
      setIsEnding(true);
      const result = await endGame(gameId, address);

      if (result.success) {
        console.log("Successfully ended the game");
        // toast({
        //   title: "Game Ending",
        //   description: "Your game results are being processed...",
        // });
      }
    } catch (error: any) {
      console.error("Error ending game:", error);
      setIsEnding(false);
      // toast({
      //   variant: "destructive",
      //   title: "Failed to end game",
      //   description: error?.response?.data?.error || "Please try again",
      // });
    }
  };

  const handleFullVerification = async () => {
    if (!address || !gameId) return;

    try {
      setIsFullVerifying(true);
      const result = await endGameWithFullVerification(gameId, address);
      setFullVerificationResult(result);
    } catch (error: any) {
      console.error("Error in full verification:", error);
      toast({
        variant: "destructive",
        title: "Full verification failed",
        description: error?.response?.data?.error || "Please try again",
      });
    } finally {
      setIsFullVerifying(false);
    }
  };

  if (!gameConfig) {
    return (
      <div className="h-[100vh] flex items-center">
        <SwishSpinner />
      </div>
    );
  }

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

  const handleCellReveal = async (position: Position) => {
    if (!address || !gameId) return;
    try {
      await clickCell(gameId, position, address);
    } catch (error: any) {
      console.error("Error revealing cell:", error);
      toast({
        variant: "destructive",
        title: "Failed to reveal cell",
        description: error?.response?.data?.error || "Please try again",
      });
    }
  };

  return (
    <main className="flex flex-col items-center justify-center">
      <div className="w-full p-4 flex justify-end">
        <ConnectButton showBalance={false} />
      </div>
      {gameConfig && (
        <>
          <div className="relative ">
            <div className="w-max absolute left-[146px] top-[6px]">
              <div className="text-start text-4xl text-[#6123ff] flex flex-col">
                <p className="text-xs leading-none">Block No.:</p>
                <p className="font-bold leading-none">{gamesPlayed}</p>
              </div>
            </div>
            <div className="w-full bottom-3 absolute justify-center text-center text-[#6123ff]">
              <div>
                <button
                  onClick={handleEndGame}
                  disabled={isEnding || !isRunning}
                  className="font-bold! text-lg hover:text-white hover:drop-shadow-[0px_0px_5px_#6123ff] px-10 leading-none"
                >
                  Verify my Guess &rsaquo;
                </button>
              </div>
            </div>
            <CountdownTimer
              remainingTime={remainingTime.remainingTime}
              onTimerEnd={() => {}}
              isRunning={isRunning}
            />
            <IsometricGrid
              // gridSize={Math.round(gameConfig.gridSize / 2)}
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
                gameId={gameId}
                address={address!}
              />
            </div>
          </div>
        </>
      )}

      <AlertDialog open={remainingTime.remainingTime === 0 || isEnding}>
        <AlertDialogContent className="bg-[#161525] border-2 border-[#5b23d4] w-1/3">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold mb-4 flex justify-center">
              {endType === "manual" ? "Level ended" : "Time's up!"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-lg text-center">
              <span className="text-[#5cffb1] my-2">
                You got {resultBugs} {resultBugs === 1 ? " bug" : " bugs"}
              </span>

              <br />

              {verificationInProg ? (
                <>
                  <span>Verifying locally...</span>

                  <SwishSpinner />
                </>
              ) : proofIsVerified ? (
                <>
                  <span className="text-[#5cffb1]">You got all the bugs!</span>
                  {!isFullVerifying && !fullVerificationResult && (
                    <div className="mt-4">
                      <button
                        onClick={handleFullVerification}
                        className="bg-[#5b23d4] text-white inset-0 hover:bg-[#4a1cb0] transition-colors rounded-md text-sm font-medium h-10 px-4 py-2"
                        disabled={isFullVerifying}
                      >
                        Verify On-Chain*
                      </button>
                      <p className="text-xs py-2">
                        *This could take over a few minutes
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
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="m-auto">
            <AlertDialogAction
              className="bg-[#beb8db] text-[#5b23d4] hover:bg-transparent hover:border hover:border-[#5b23d4]"
              onClick={startNewGame}
              disabled={verificationInProg || isFullVerifying}
            >
              {isLoading ? "Starting..." : "Next Block ›"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

{
  /* <IsometricGrid
            gridSize={gridSize}
            squareSize={35}
            initialTime={duration}
            updateInterval={2}
            isRunning={gameIsRunning}
          /> */
}
