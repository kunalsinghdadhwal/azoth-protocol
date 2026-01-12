"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { GameStatus, formatAddress, isBotAddress } from "@/utils/uno/types";

interface GameListItem {
  id: bigint;
  players: readonly `0x${string}`[];
  status: number;
}

interface GameSidebarProps {
  activeGames: GameListItem[];
  notStartedGames: GameListItem[];
  currentGameId: bigint | null;
  onSelectGame: (gameId: bigint) => void;
  onCreateGame: (isBot: boolean) => void;
  onJoinGame: (gameId: bigint) => void;
  createGameFee: bigint;
  joinGameFee: bigint;
  isCreating: boolean;
  isJoining: boolean;
  userAddress: `0x${string}` | undefined;
}

export function GameSidebar({
  activeGames,
  notStartedGames,
  currentGameId,
  onSelectGame,
  onCreateGame,
  onJoinGame,
  createGameFee,
  joinGameFee,
  isCreating,
  isJoining,
  userAddress,
}: GameSidebarProps) {
  const [createBotGame, setCreateBotGame] = useState(true);

  const isPlayerInGame = (game: GameListItem) => {
    return game.players.some(
      (p) => p.toLowerCase() === userAddress?.toLowerCase()
    );
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case GameStatus.NotStarted:
        return (
          <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 border border-amber-300 rounded font-medium">
            Waiting
          </span>
        );
      case GameStatus.Started:
        return (
          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 border border-green-300 rounded font-medium">
            Active
          </span>
        );
      case GameStatus.Ended:
        return (
          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 border border-gray-300 rounded font-medium">
            Ended
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <aside className="w-72 border-r-2 border-amber-800 flex flex-col h-full bg-wood-panel scrollbar-wood">
      {/* Create Game Section */}
      <div className="p-4 border-b-2 border-amber-700/50">
        <h2 className="text-sm font-bold text-amber-900 mb-3 text-balance">Create Game</h2>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={createBotGame}
              onChange={(e) => setCreateBotGame(e.target.checked)}
              className="w-4 h-4 rounded border-amber-400 bg-white text-amber-600 focus:ring-amber-500 focus:ring-offset-0"
            />
            <span className="text-sm text-amber-900">Play against Bot</span>
          </label>

          <button
            type="button"
            onClick={() => onCreateGame(createBotGame)}
            disabled={isCreating || !userAddress}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
          >
            {isCreating ? (
              <>
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              "Create New Game"
            )}
          </button>

          <p className="text-xs text-amber-800/70 tabular-nums">
            Fee: {formatEther(createGameFee)} ETH
          </p>
        </div>
      </div>

      {/* Games List */}
      <div className="flex-1 overflow-y-auto scrollbar-wood">
        {/* Waiting Games */}
        {notStartedGames.length > 0 && (
          <div className="p-4 border-b-2 border-amber-700/30">
            <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3">
              Open Lobbies ({notStartedGames.length})
            </h3>
            <div className="space-y-2">
              {notStartedGames.map((game) => {
                const isInGame = isPlayerInGame(game);
                const isSelected = currentGameId === game.id;

                return (
                  <button
                    key={game.id.toString()}
                    type="button"
                    onClick={() => onSelectGame(game.id)}
                    className={`
                      w-full p-3 rounded-lg text-left transition-all
                      ${isSelected
                        ? "bg-amber-100 border-2 border-amber-500 shadow-md"
                        : "bg-white/70 border border-amber-200 hover:border-amber-400 hover:shadow-sm"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono text-amber-900 tabular-nums font-semibold">
                        Game #{game.id.toString()}
                      </span>
                      {getStatusBadge(game.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-amber-700">
                        {game.players.length}/10 players
                      </span>
                      {!isInGame && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onJoinGame(game.id);
                          }}
                          disabled={isJoining}
                          className="px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors disabled:opacity-50 font-medium shadow-sm"
                        >
                          {isJoining ? "..." : "Join"}
                        </button>
                      )}
                      {isInGame && (
                        <span className="text-xs text-green-600 font-medium">Joined</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-amber-800/60 mt-2 tabular-nums">
              Join fee: {formatEther(joinGameFee)} ETH
            </p>
          </div>
        )}

        {/* Active Games */}
        {activeGames.length > 0 && (
          <div className="p-4">
            <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3">
              Active Games ({activeGames.length})
            </h3>
            <div className="space-y-2">
              {activeGames.map((game) => {
                const isInGame = isPlayerInGame(game);
                const isSelected = currentGameId === game.id;

                return (
                  <button
                    key={game.id.toString()}
                    type="button"
                    onClick={() => isInGame && onSelectGame(game.id)}
                    disabled={!isInGame}
                    className={`
                      w-full p-3 rounded-lg text-left transition-all
                      ${isSelected
                        ? "bg-amber-100 border-2 border-amber-500 shadow-md"
                        : isInGame
                          ? "bg-white/70 border border-amber-200 hover:border-amber-400 hover:shadow-sm cursor-pointer"
                          : "bg-white/40 border border-amber-100 cursor-not-allowed opacity-60"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono text-amber-900 tabular-nums font-semibold">
                        Game #{game.id.toString()}
                      </span>
                      {getStatusBadge(game.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-amber-700">
                        {game.players.length} players
                      </span>
                      {isInGame && (
                        <span className="text-xs text-green-600 font-medium">Your game</span>
                      )}
                    </div>
                    {/* Player list */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {game.players.slice(0, 3).map((player) => (
                        <span
                          key={player}
                          className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded"
                        >
                          {isBotAddress(player) ? "Bot" : formatAddress(player)}
                        </span>
                      ))}
                      {game.players.length > 3 && (
                        <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                          +{game.players.length - 3}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {activeGames.length === 0 && notStartedGames.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-amber-800/70 text-sm text-pretty">No active games found</p>
            <p className="text-amber-700/50 text-xs mt-1 text-pretty">Create a new game to get started</p>
          </div>
        )}
      </div>
    </aside>
  );
}
