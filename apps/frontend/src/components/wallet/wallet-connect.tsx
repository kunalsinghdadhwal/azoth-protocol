"use client";

import { usePrivy, useLogin, useLogout, useWallets } from "@privy-io/react-auth";
import { Loader2, Wallet, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function WalletConnect() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { login } = useLogin();
  const { logout } = useLogout();

  // Loading state while Privy initializes
  if (!ready) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  // Not authenticated - show connect button
  if (!authenticated) {
    return (
      <Button onClick={login} variant="default">
        <Wallet className="mr-2 size-4" />
        Connect Wallet
      </Button>
    );
  }

  // Authenticated - show address and disconnect
  const wallet = wallets[0];
  const address = wallet?.address;
  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Connected";

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" className="font-mono">
        <Wallet className="mr-2 size-4" />
        {shortAddress}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={logout}
        title="Disconnect wallet"
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}
