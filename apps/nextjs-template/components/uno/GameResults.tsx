"use client";

import { formatAddress, isBotAddress } from "@/utils/uno/types";

interface GameResultsProps {
  gameId: bigint;
  players: readonly `0x${string}`[];
  winner: `0x${string}` | null;
  currentUserAddress: `0x${string}` | undefined;
  gameHash: `0x${string}` | null;
  onPlayAgain: () => void;
}

export function GameResults({
  gameId,
  players,
  winner,
  currentUserAddress,
  gameHash,
  onPlayAgain,
}: GameResultsProps) {
  const isWinner = winner?.toLowerCase() === currentUserAddress?.toLowerCase();
  const winnerIsBot = winner ? isBotAddress(winner) : false;

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-wood-table">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Result banner */}
        <div className={`
          p-8 rounded-2xl border-2 shadow-xl
          ${isWinner
            ? "bg-green-50 border-green-600"
            : "bg-white/90 border-amber-700"
          }
        `}>
          {isWinner ? (
            <>
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold text-green-700 text-balance">You Win!</h2>
              <p className="text-green-600 mt-2 text-pretty">Congratulations on your victory!</p>
            </>
          ) : winner ? (
            <>
              <div className="text-6xl mb-4">{winnerIsBot ? "🤖" : "👤"}</div>
              <h2 className="text-3xl font-bold text-amber-900 text-balance">Game Over</h2>
              <p className="text-amber-700 mt-2 text-pretty">
                {winnerIsBot ? "Bot" : formatAddress(winner)} wins this round
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-3xl font-bold text-amber-900 text-balance">Game Ended</h2>
              <p className="text-amber-700 mt-2 text-pretty">The game has concluded</p>
            </>
          )}
        </div>

        {/* Game stats */}
        <div className="bg-white/90 border-2 border-amber-700 rounded-xl p-4 shadow-lg">
          <h3 className="text-sm font-bold text-amber-900 mb-4 text-balance">Game Summary</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-2xl font-bold text-amber-900 font-mono tabular-nums">{gameId.toString()}</p>
              <p className="text-xs text-amber-600">Game ID</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-2xl font-bold text-amber-900 font-mono tabular-nums">{players.length}</p>
              <p className="text-xs text-amber-600">Players</p>
            </div>
          </div>

          {/* Final standings */}
          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider text-balance">Final Standings</h4>
            {players.map((player, index) => {
              const isPlayerWinner = player.toLowerCase() === winner?.toLowerCase();
              const isCurrentUser = player.toLowerCase() === currentUserAddress?.toLowerCase();

              return (
                <div
                  key={player}
                  className={`
                    flex items-center justify-between p-2 rounded-lg
                    ${isPlayerWinner
                      ? "bg-green-100 border-2 border-green-500"
                      : "bg-amber-50 border border-amber-200"
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className={`
                      size-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${isPlayerWinner ? "bg-green-600 text-white" : "bg-amber-200 text-amber-800"}
                    `}>
                      {index + 1}
                    </span>
                    <span className={`font-mono text-sm ${isCurrentUser ? "text-amber-900 font-semibold" : "text-amber-800"}`}>
                      {isBotAddress(player) ? "Bot" : formatAddress(player)}
                    </span>
                    {isCurrentUser && <span className="text-xs text-amber-600">(You)</span>}
                  </div>
                  {isPlayerWinner && (
                    <span className="text-green-600 text-sm font-semibold">Winner</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Game hash (verification) */}
        {gameHash && gameHash !== "0x0000000000000000000000000000000000000000000000000000000000000000" && (
          <div className="bg-white/70 border border-amber-300 rounded-lg p-4 shadow">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
              Game Hash (Verification)
            </h4>
            <p className="font-mono text-xs text-amber-600 break-all">{gameHash}</p>
          </div>
        )}

        {/* Play again button */}
        <button
          type="button"
          onClick={onPlayAgain}
          className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-lg"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
