import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { holesky } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Blockchain Gods: Block Nonce minigame",
  projectId: "33ab7578a6c3d187b8022d964de440d7",
  chains: [holesky],
  ssr: true,
});
