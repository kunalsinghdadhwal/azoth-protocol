"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useState } from "react";

const queryClient = new QueryClient();

const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [config] = useState(() =>
    getDefaultConfig({
      appName: "Inco NextJS Template",
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID || "inco-nextjs-template",
      chains: [baseSepolia],
      ssr: true,
    })
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default WalletProvider;
