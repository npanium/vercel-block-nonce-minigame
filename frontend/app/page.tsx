"use client";
import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import heroImage from "../public/hero-logo.png";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { createGame } from "@/lib/api";
import { useRouter } from "next/navigation";
import AnimatedBlockNonce from "../public/block-nonce_animated.svg";

export default function Home() {
  const { isConnected, address } = useAccount();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartGame = async () => {
    try {
      setIsLoading(true);

      const newGame = await createGame(address!.toString());
      router.push(`/game/${newGame.gameId}`);
    } catch (error: any) {
      console.error("Failed to create game:", error);
      // if(error.response.data.gameId){
      // Ask user to continue game
      //}
      if (!isConnected || !address) {
        toast({
          variant: "destructive",
          title: "Oh No! No wallet found ☹️",
          description: "Please connect your wallet to proceed...",
          action: <ConnectButton showBalance={false} label="Connect" />,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to start game",
          description: "Please try again in a few seconds.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center">
      <div className="w-full p-4 flex justify-end">
        <ConnectButton showBalance={false} />
      </div>

      <Image
        src={heroImage}
        placeholder="blur"
        className="logo p-4 max-h-64 mt-24 cursor-default"
        style={{ objectFit: "contain" }}
        alt="Blockchain Gods logo"
      />
      <p>Presents</p>
      <div className="w-[350px] mb-20">
        <AnimatedBlockNonce />
      </div>
      {/* <h1 className="text-4xl font-bold mb-8">Block-Nonce Game</h1> */}
      <button onClick={handleStartGame} className="pulse-button">
        Start Game
      </button>
    </main>
  );
}
