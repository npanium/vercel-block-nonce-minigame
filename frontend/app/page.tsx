"use client";
import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import heroImage from "../public/hero-logo.png";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useToast } from "@/hooks/use-toast";
import AnimatedBlockNonce from "../public/block-nonce_animated.svg";
import { useGameCreation } from "@/hooks/useGameCreation";
import InstructionsComponent from "@/components/InstructionsComponent";

export default function Home() {
  const { startGuestGame, startWeb3Game, isLoading } = useGameCreation();

  return (
    <main className="flex flex-col items-center justify-center">
      <div className="w-full p-4 flex justify-end">
        <div className="relative inline-block">
          {/* <ConnectButton showBalance={false} /> */}
          <button
            onClick={startWeb3Game}
            className="bg-[#5c39ff]/50 border border-transparent text-[#dfd8ff]/50 px-5 py-2 rounded-lg 
        "
            disabled
          >
            Connect Wallet
          </button>
          <div className="absolute -top-3 -right-3 bg-[#39ffb3] text-[#6123ff] text-xs font-bold px-2 py-1 rounded-full transform rotate-12 shadow-lg">
            <div className="relative">
              <span className="relative z-10">Coming Soon!</span>
              {/* Subtle animation glow effect */}
            </div>
          </div>
        </div>
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
        onClick={startWeb3Game}
        className="bg-[#5c39ff]/50 border border-transparent text-[#dfd8ff]/50 px-5 py-2 rounded-lg 
        "
        // disabled={isLoading}
        disabled
        style={
          isLoading
            ? {
                background: "#6e6c77",
              }
            : {}
        }
      >
        Start Game
      </button>
      <p className="my-5">Or</p>
      <button
        onClick={startGuestGame}
        className="bg-[#dfd8ff] border border-transparent text-[#5c39ff] px-5 py-2 rounded-lg hover:bg-[#dfd8ff]/10 hover:border hover:border-[#5c39ff]"
        disabled={isLoading}
        style={
          isLoading
            ? {
                background: "#6e6c77",
              }
            : {}
        }
      >
        Play without connecting wallet
      </button>
      {/* <p className="text-xs mt-4">
        Use this option if you don&apos;t know what a <i>wallet</i> is
      </p> */}
      <p className="text-xs mt-4">
        The game is best experienced on a <i>desktop</i> browser
      </p>
      <InstructionsComponent />
    </main>
  );
}
