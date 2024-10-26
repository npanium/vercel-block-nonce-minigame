import type { Metadata } from "next";
import { Inter, Chakra_Petch } from "next/font/google";
import "./styles/globals.css";
import "./styles/styles.css";
import "./styles/customWalletStyles.css";
import "./styles/logoanimation.css";

import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";

// const inter = Inter({ subsets: ["latin"] });
const chakra = Chakra_Petch({ weight: "600", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Block Nonce Mini-Game",
  description: "A Blockchain Gods minigame",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${chakra.className} dark`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
