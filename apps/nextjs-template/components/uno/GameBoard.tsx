"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Card, DrawPile, DiscardPile, MiniCard } from "./Card";
import { PlayerHand, PlayerHandSkeleton } from "./PlayerHand";
import { type UnoCard, type GameState, formatAddress, isBotAddress } from "@/utils/uno/types";

interface GameBoardProps {
  gameState: GameState;
  playerHand: UnoCard[];
  topCard: UnoCard | null;
  currentPlayerAddress: `0x${string}` | undefined;
  onPlayCard: (card: UnoCard) => void;
  onDrawCard: () => void;
  isDrawing: boolean;
  isPlaying: boolean;
  isDecrypting: boolean;
}

// Helper to categorize opponents by position
function getOpponentPositions(
  players: `0x${string}`[],
  currentPlayerAddress: `0x${string}` | undefined
) {
  const opponents = players.filter(
    (p) => p.toLowerCase() !== currentPlayerAddress?.toLowerCase()
  );

  const count = opponents.length;

  if (count === 0) return { top: [], left: [], right: [] };
  if (count === 1) return { top: opponents, left: [], right: [] };
  if (count === 2) return { top: [opponents[0]], left: [], right: [opponents[1]] };
  if (count === 3) return { top: [opponents[0]], left: [opponents[1]], right: [opponents[2]] };

  // For 4+ opponents, distribute evenly
  const topCount = Math.ceil(count / 2);
  return {
    top: opponents.slice(0, topCount),
    left: opponents.slice(topCount, topCount + Math.floor((count - topCount) / 2)),
    right: opponents.slice(topCount + Math.floor((count - topCount) / 2)),
  };
}

export function GameBoard({
  gameState,
  playerHand,
  topCard,
  currentPlayerAddress,
  onPlayCard,
  onDrawCard,
  isDrawing,
  isPlaying,
  isDecrypting,
}: GameBoardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [unoCalled, setUnoCalled] = useState(false);

  const isCurrentTurn =
    currentPlayerAddress &&
    gameState.players[Number(gameState.currentPlayerIndex)]?.toLowerCase() ===
      currentPlayerAddress.toLowerCase();

  const currentTurnPlayer = gameState.players[Number(gameState.currentPlayerIndex)];
  const { top, left, right } = getOpponentPositions(gameState.players, currentPlayerAddress);

  // Reset unoCalled when hand size changes (after playing)
  const showCallUno = playerHand.length <= 2 && playerHand.length > 0 && isCurrentTurn && !unoCalled;

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-full bg-wood-table">
      {/* Top opponents area */}
      <div className="flex-shrink-0 p-4">
        <div className="flex items-start justify-center gap-6 flex-wrap">
          {top.map((player) => {
            const isTheirTurn =
              gameState.players[Number(gameState.currentPlayerIndex)]?.toLowerCase() ===
              player.toLowerCase();

            return (
              <motion.div
                key={player}
                initial={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                  flex flex-col items-center gap-2 p-3 rounded-xl
                  ${isTheirTurn ? "bg-amber-100 border-2 border-amber-500 shadow-lg" : "bg-white/60 border border-amber-200"}
                `}
              >
                <span className={`text-xs font-medium ${isTheirTurn ? "text-amber-800" : "text-amber-700"}`}>
                  {isBotAddress(player) ? "BOT" : formatAddress(player)}
                </span>
                <MiniCard count={7} />
                {isTheirTurn && (
                  <span className="text-xs text-amber-600 font-medium animate-pulse">Playing...</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Middle section: left opponents + center + right opponents */}
      <div className="grid grid-cols-[80px_1fr_80px] flex-1 min-h-0">
        {/* Left opponents */}
        <div className="flex flex-col items-center justify-center gap-4 p-2">
          {left.map((player) => {
            const isTheirTurn =
              gameState.players[Number(gameState.currentPlayerIndex)]?.toLowerCase() ===
              player.toLowerCase();

            return (
              <motion.div
                key={player}
                initial={shouldReduceMotion ? {} : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-lg
                  ${isTheirTurn ? "bg-amber-100 border border-amber-400" : "bg-white/50"}
                `}
              >
                <span className="text-[10px] text-amber-800 font-medium truncate max-w-[70px]">
                  {isBotAddress(player) ? "BOT" : formatAddress(player)}
                </span>
                <MiniCard count={7} vertical />
                {isTheirTurn && (
                  <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Center play area */}
        <div className="flex flex-col items-center justify-center gap-6 p-4">
          {/* Draw and Discard piles */}
          <div className="flex items-center gap-12">
            <DrawPile
              count={gameState.deckRemaining}
              onClick={onDrawCard}
              disabled={!isCurrentTurn || isDrawing || isPlaying}
              isDrawing={isDrawing}
            />
            <DiscardPile topCard={topCard} moveCount={gameState.moveCount} />
          </div>

          {/* Call Uno button */}
          {showCallUno && (
            <motion.button
              initial={shouldReduceMotion ? {} : { scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
              onClick={() => setUnoCalled(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl shadow-lg transition-colors"
            >
              Call Uno!
            </motion.button>
          )}

          {unoCalled && playerHand.length <= 2 && (
            <motion.div
              initial={shouldReduceMotion ? {} : { scale: 0.9 }}
              animate={{ scale: 1 }}
              className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow"
            >
              UNO Called!
            </motion.div>
          )}

          {/* Turn indicator */}
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white/80 rounded-full shadow">
            {isCurrentTurn ? (
              <>
                <div className="size-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-700 text-sm font-medium">Your turn - play a card or draw</span>
              </>
            ) : (
              <>
                <div className="size-2.5 rounded-full bg-amber-500" />
                <span className="text-amber-800 text-sm">
                  Waiting for {isBotAddress(currentTurnPlayer) ? "Bot" : formatAddress(currentTurnPlayer)}...
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right opponents */}
        <div className="flex flex-col items-center justify-center gap-4 p-2">
          {right.map((player) => {
            const isTheirTurn =
              gameState.players[Number(gameState.currentPlayerIndex)]?.toLowerCase() ===
              player.toLowerCase();

            return (
              <motion.div
                key={player}
                initial={shouldReduceMotion ? {} : { opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-lg
                  ${isTheirTurn ? "bg-amber-100 border border-amber-400" : "bg-white/50"}
                `}
              >
                <span className="text-[10px] text-amber-800 font-medium truncate max-w-[70px]">
                  {isBotAddress(player) ? "BOT" : formatAddress(player)}
                </span>
                <MiniCard count={7} vertical />
                {isTheirTurn && (
                  <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom: Current player's hand */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-t from-amber-900/20 to-transparent">
        {isDecrypting ? (
          <PlayerHandSkeleton />
        ) : (
          <PlayerHand
            cards={playerHand}
            onPlayCard={onPlayCard}
            isCurrentTurn={isCurrentTurn ?? false}
            disabled={isPlaying || isDrawing}
          />
        )}
      </div>
    </div>
  );
}

// Loading skeleton for the game board
export function GameBoardSkeleton() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-full bg-wood-table">
      {/* Top opponents skeleton */}
      <div className="flex-shrink-0 p-4">
        <div className="flex items-center justify-center gap-6">
          {Array.from({ length: 1 }).map((_, i) => (
            <div key={i} className="w-32 h-24 bg-white/40 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>

      {/* Center skeleton */}
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-12">
          <div className="w-20 h-[120px] bg-red-400/50 rounded-lg animate-pulse" />
          <div className="w-20 h-[120px] bg-amber-400/50 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Bottom skeleton */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-t from-amber-900/20 to-transparent">
        <PlayerHandSkeleton />
      </div>
    </div>
  );
}
