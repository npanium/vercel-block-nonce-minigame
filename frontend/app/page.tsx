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
import { useGameCreation } from "@/hooks/useGameCreation";

export default function Home() {
  const { startNewGame, isLoading } = useGameCreation();

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
      <button
        onClick={startNewGame}
        className="pulse-button"
        disabled={isLoading}
      >
        Start Game
      </button>
    </main>
  );
}
