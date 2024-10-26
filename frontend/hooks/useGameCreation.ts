import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { createGame } from "@/lib/api";

export function useGameCreation() {
  const { isConnected, address } = useAccount();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const startNewGame = async () => {
    if (!isConnected || !address) {
      toast({
        variant: "destructive",
        title: "Oh No! No wallet found ☹️",
        description: "Please connect your wallet to proceed...",
        // action: <ConnectButton showBalance={false} label="Connect" />,
      });
      return;
    }

    try {
      setIsLoading(true);
      const newGame = await createGame(address.toString());
      router.push(`/game/${newGame.gameId}`);
    } catch (error: any) {
      console.error("Failed to create game:", error);
      toast({
        variant: "destructive",
        title: "Failed to start game",
        description: "Please try again in a few seconds.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    startNewGame,
    isLoading,
  };
}
