"use client";

import { formatEther } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface GameHeaderProps {
  currentGameId: bigint | null;
  encryptionFee: bigint;
  sessionActive?: boolean;
  sessionExpiresAt?: Date | null;
  onRevokeSession?: () => void;
}

export function GameHeader({
  currentGameId,
  encryptionFee,
  sessionActive = false,
  sessionExpiresAt,
  onRevokeSession,
}: GameHeaderProps) {
  // Calculate time remaining for session
  const getTimeRemaining = () => {
    if (!sessionExpiresAt) return null;
    const now = new Date();
    const diff = sessionExpiresAt.getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    const minutes = Math.floor(diff / 60000);
    if (minutes >= 60) {
      return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b-2 border-amber-800 bg-wood-panel">
      {/* Logo / Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-lg bg-red-600 border-2 border-red-800 flex items-center justify-center shadow-md">
            <span
              className="text-yellow-400 font-black text-sm"
              style={{ transform: "rotate(-10deg)" }}
            >
              UNO
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-amber-900 text-balance">Confidential UNO</h1>
            <p className="text-xs text-amber-700/70">Powered by Inco fhEVM</p>
          </div>
        </div>

        {/* Current game indicator */}
        {currentGameId && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/60 border border-amber-300 rounded-lg shadow-sm">
            <div className="size-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-amber-900 font-mono tabular-nums">
              Game #{currentGameId.toString()}
            </span>
          </div>
        )}

        {/* Session key indicator */}
        {sessionActive && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-300 rounded-lg shadow-sm">
            <svg className="size-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            <span className="text-sm text-green-800 font-medium">Session Active</span>
            {sessionExpiresAt && (
              <span className="text-xs text-green-600 tabular-nums">
                ({getTimeRemaining()})
              </span>
            )}
            {onRevokeSession && (
              <button
                type="button"
                onClick={onRevokeSession}
                className="ml-1 p-0.5 text-green-600 hover:text-red-600 transition-colors"
                title="End session"
              >
                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right side - Wallet & Info */}
      <div className="flex items-center gap-4">
        {/* Fee indicator */}
        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs text-amber-700/70">Network Fee</span>
          <span className="text-sm text-amber-900 font-mono tabular-nums">
            {formatEther(encryptionFee)} ETH
          </span>
        </div>

        {/* Wallet connect */}
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div
                {...(!ready && {
                  "aria-hidden": true,
                  style: {
                    opacity: 0,
                    pointerEvents: "none",
                    userSelect: "none",
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors text-sm shadow-md"
                      >
                        Connect Wallet
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors text-sm shadow-md"
                      >
                        Wrong Network
                      </button>
                    );
                  }

                  return (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white border border-amber-300 rounded-lg transition-colors shadow-sm"
                        aria-label="Select network"
                      >
                        {chain.hasIcon && (
                          <div
                            style={{
                              background: chain.iconBackground,
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              overflow: "hidden",
                            }}
                          >
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? "Chain icon"}
                                src={chain.iconUrl}
                                style={{ width: 20, height: 20 }}
                              />
                            )}
                          </div>
                        )}
                        <span className="text-sm text-amber-900">{chain.name}</span>
                      </button>

                      <button
                        onClick={openAccountModal}
                        type="button"
                        className="flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white border border-amber-300 rounded-lg transition-colors shadow-sm"
                      >
                        <span className="text-sm text-amber-900 font-mono">
                          {account.displayName}
                        </span>
                        {account.displayBalance && (
                          <span className="hidden sm:inline text-sm text-amber-700/70 tabular-nums">
                            {account.displayBalance}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}
