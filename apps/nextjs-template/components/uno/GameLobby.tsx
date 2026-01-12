"use client";

import { formatAddress, isBotAddress } from "@/utils/uno/types";

interface GameLobbyProps {
  gameId: bigint;
  players: readonly `0x${string}`[];
  currentUserAddress: `0x${string}` | undefined;
  onStartGame: () => void;
  isStarting: boolean;
}

export function GameLobby({
  gameId,
  players,
  currentUserAddress,
  onStartGame,
  isStarting,
}: GameLobbyProps) {
  const isHost = players[0]?.toLowerCase() === currentUserAddress?.toLowerCase();
  const canStart = players.length >= 2;

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-wood-table">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-amber-900 text-balance">Game Lobby</h2>
          <p className="text-amber-700 mt-1 font-mono tabular-nums">Game #{gameId.toString()}</p>
        </div>

        {/* Players list */}
        <div className="bg-white/90 border-2 border-amber-700 rounded-xl p-4 shadow-lg">
          <h3 className="text-sm font-bold text-amber-900 mb-3 text-balance">
            Players ({players.length}/10)
          </h3>
          <div className="space-y-2">
            {players.map((player, index) => {
              const isCurrentUser = player.toLowerCase() === currentUserAddress?.toLowerCase();
              const isBot = isBotAddress(player);

              return (
                <div
                  key={player}
                  className={`
                    flex items-center justify-between p-3 rounded-lg
                    ${isCurrentUser
                      ? "bg-amber-100 border-2 border-amber-500"
                      : "bg-amber-50 border border-amber-200"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      size-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${isBot
                        ? "bg-red-600 text-yellow-400 border-2 border-red-800"
                        : "bg-amber-600 text-white"
                      }
                    `}>
                      {isBot ? "B" : index + 1}
                    </div>
                    <div>
                      <p className={`font-mono text-sm ${isCurrentUser ? "text-amber-900 font-semibold" : "text-amber-800"}`}>
                        {isBot ? "Bot Player" : formatAddress(player)}
                      </p>
                      <div className="flex gap-2">
                        {index === 0 && (
                          <span className="text-xs text-amber-600 font-medium">Host</span>
                        )}
                        {isCurrentUser && (
                          <span className="text-xs text-green-600 font-medium">You</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="size-3 rounded-full bg-green-500 animate-pulse" />
                </div>
              );
            })}

            {/* Empty slots */}
            {Array.from({ length: Math.min(4, 10 - players.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 border border-dashed border-amber-300"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-amber-400 text-sm">?</span>
                  </div>
                  <span className="text-amber-500 text-sm">Waiting for player...</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {isHost && (
            <button
              type="button"
              onClick={onStartGame}
              disabled={!canStart || isStarting}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {isStarting ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Starting Game...
                </>
              ) : canStart ? (
                "Start Game"
              ) : (
                "Need at least 2 players"
              )}
            </button>
          )}

          {!isHost && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 text-amber-700 bg-white/80 px-4 py-2 rounded-full shadow">
                <div className="size-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-pretty">Waiting for host to start the game...</span>
              </div>
            </div>
          )}
        </div>

        {/* Game info */}
        <div className="bg-white/70 border border-amber-300 rounded-xl p-4 shadow">
          <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
            Game Rules
          </h4>
          <ul className="text-xs text-amber-700 space-y-1 text-pretty">
            <li>Each player starts with 7 cards</li>
            <li>Match cards by color or number</li>
            <li>Wild cards can be played anytime</li>
            <li>First player to empty their hand wins</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
