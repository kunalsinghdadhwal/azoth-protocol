"use client";

import { PrivyProvider as Privy } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { defaultChain, supportedChains } from "@/lib/chains";
import { wagmiConfig } from "@/lib/wagmi-config";

const queryClient = new QueryClient();

interface PrivyProviderProps {
  children: React.ReactNode;
}

export function PrivyProvider({ children }: PrivyProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    // Wallet connection requires NEXT_PUBLIC_PRIVY_APP_ID
    return <>{children}</>;
  }

  return (
    <Privy
      appId={appId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#22c55e",
          logo: "/logo.svg",
          landingHeader: "Connect to ShadowSwap",
          loginMessage: "Trade privately with encrypted swaps",
        },
        loginMethods: ["wallet", "email", "google"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain,
        supportedChains: [...supportedChains],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </Privy>
  );
}
