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
import { clickCell, getPlayerStats } from "@/lib/api";
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

export default function GamePage() {
  const { gameId } = useParams() as { gameId: string };
  const { address } = useAccount();
  const { toast } = useToast();
  const [gamesPlayed, setGamesPlayed] = useState(0);
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

  if (!gameConfig) {
    return <LoadingComponent />;
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
                <button className="font-bold! text-lg hover:text-white hover:drop-shadow-[0px_0px_5px_#6123ff] px-10 leading-none">
                  Next Block &rsaquo;
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
              totalTime={gameConfig.duration}
              remainingTime={remainingTime.remainingTime}
              updateInterval={1}
              isRunning={isRunning}
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

      {gameState?.isEnded && (
        <AlertDialog open>
          {/* <AlertDialogTrigger >
            <button
              // onClick={() => (window.location.href = "/")}
              className="pulse-button"
            >
              Next Block{" "}
            </button>
          </AlertDialogTrigger> */}
          <AlertDialogContent className="bg-[#161525] border-2 border-[#5b23d4]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-bold mb-4">
                Time&apos;s up!
              </AlertDialogTitle>
              <AlertDialogDescription>
                You got __ bugs
                <br /> Verifying locally...
                <br /> You did not get all the hidden bugs!
                {/* 
                You got all the bugs! Points: __
                Proceed to next block while the proof is being verified on-chain
                */}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="m-auto">
              {/* <AlertDialogCancel>Cancel</AlertDialogCancel> */}
              <AlertDialogAction className="bg-[#beb8db] text-[#5b23d4] hover:bg-transparent hover:border hover:border-[#5b23d4]">
                Next Block &rsaquo;
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
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
