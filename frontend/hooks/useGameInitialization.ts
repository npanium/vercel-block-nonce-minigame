import { useState } from "react";
import { useToast } from "./use-toast";
import { getGameState, startGame } from "@/lib/api";
import { GameConfig, GameState } from "@/types/game";
import { ApiError } from "@/lib/api";

interface UseGameInitializationReturn {
  gameConfig: GameConfig | null;
  error: string | null;
  initializeGame: () => Promise<void>;
  isLoading: boolean;
}

export const useGameInitialization = (
  playerIdentifier: string,
  gameId: string
): UseGameInitializationReturn => {
  const { toast } = useToast();
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initializeGame = async () => {
    setIsLoading(true);
    setError(null);
    console.log("Trying to get existing game");
    try {
      const existingGame = await getGameState(playerIdentifier, gameId);
      console.log(`Existing Game info: ${JSON.stringify(existingGame)}`);
      if (existingGame) {
        if (
          existingGame.startTime !== undefined &&
          existingGame.duration !== undefined &&
          existingGame.gridSize !== undefined &&
          existingGame.bugs !== undefined
        ) {
          const config: GameConfig = {
            startTime: existingGame.startTime,
            duration: existingGame.duration,
            gridSize: existingGame.gridSize,
            bugs: existingGame.bugs,
          };
          setGameConfig(config);
          return;
        }
      }

      const generatedData = await startGame(playerIdentifier, gameId);

      const config: GameConfig = {
        startTime: generatedData.startTime,
        duration: generatedData.duration,
        gridSize: generatedData.gridSize,
        bugs: generatedData.bugs,
      };
      setGameConfig(config);
    } catch (error) {
      const errorMessage =
        error instanceof ApiError ? error.message : "Failed to initialize game";

      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { gameConfig, error, initializeGame, isLoading };
};
