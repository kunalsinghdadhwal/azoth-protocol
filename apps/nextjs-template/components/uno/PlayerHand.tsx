"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Card } from "./Card";
import { type UnoCard } from "@/utils/uno/types";

interface PlayerHandProps {
  cards: UnoCard[];
  onPlayCard: (card: UnoCard) => void;
  isCurrentTurn: boolean;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PlayerHand({
  cards,
  onPlayCard,
  isCurrentTurn,
  isLoading = false,
  disabled = false,
}: PlayerHandProps) {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const handleCardClick = (card: UnoCard, index: number) => {
    if (disabled || !isCurrentTurn) return;

    if (selectedCard === index) {
      // Double click to play
      onPlayCard(card);
      setSelectedCard(null);
    } else {
      // First click to select
      setSelectedCard(index);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-3 px-4 py-2 bg-white/80 rounded-full">
          <div className="size-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-amber-800">Decrypting your hand...</span>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-amber-800/60 bg-white/60 px-4 py-2 rounded-full">No cards in hand</span>
      </div>
    );
  }

  // Calculate fan layout
  const cardCount = cards.length;
  const maxFanAngle = 40; // Total spread angle
  const fanAngle = Math.min(6, maxFanAngle / Math.max(cardCount - 1, 1)); // Degrees between cards
  const totalAngle = (cardCount - 1) * fanAngle;
  const startAngle = -totalAngle / 2;

  // Calculate overlap based on card count
  const baseOverlap = 50; // Base overlap in pixels
  const overlap = cardCount > 10 ? 35 : cardCount > 7 ? 40 : baseOverlap;

  return (
    <div className="space-y-3">
      {/* Turn indicator */}
      <div className="flex items-center justify-between px-4">
        <h3 className="text-sm font-semibold text-amber-900 text-balance">Your Hand</h3>
        {isCurrentTurn ? (
          <span className="px-3 py-1 text-xs font-semibold bg-green-500 text-white rounded-full shadow">
            Your Turn
          </span>
        ) : (
          <span className="px-3 py-1 text-xs font-medium bg-white/80 text-amber-700 border border-amber-300 rounded-full">
            Waiting...
          </span>
        )}
      </div>

      {/* Cards container with fanned layout */}
      <div className="relative flex justify-center items-end pb-4 min-h-[140px]">
        <div
          className="relative flex justify-center"
          style={{
            width: `${Math.min(cardCount * overlap + 64, 600)}px`,
          }}
        >
          {cards.map((card, index) => {
            const rotation = startAngle + index * fanAngle;
            const isSelected = selectedCard === index;

            return (
              <motion.div
                key={`${card.id}-${index}`}
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: isSelected ? -24 : 0,
                  scale: isSelected ? 1.05 : 1,
                }}
                whileHover={
                  !disabled && isCurrentTurn && !shouldReduceMotion
                    ? { y: -12, transition: { duration: 0.15 } }
                    : {}
                }
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute cursor-pointer"
                style={{
                  left: `${index * overlap}px`,
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: "bottom center",
                  zIndex: isSelected ? 100 : index,
                }}
              >
                <Card
                  card={card}
                  onClick={() => handleCardClick(card, index)}
                  isSelected={isSelected}
                  disabled={disabled || !isCurrentTurn}
                  size="md"
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Help text */}
      {isCurrentTurn && selectedCard !== null && (
        <p className="text-xs text-amber-700 text-center bg-white/60 mx-auto px-4 py-1 rounded-full w-fit text-pretty">
          Click again to play, or select a different card
        </p>
      )}
      {isCurrentTurn && selectedCard === null && (
        <p className="text-xs text-amber-600/80 text-center text-pretty">
          Select a card to play
        </p>
      )}
    </div>
  );
}

// Skeleton loading state for the hand
export function PlayerHandSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-4">
        <div className="h-4 w-20 bg-amber-200/50 rounded animate-pulse" />
        <div className="h-6 w-20 bg-amber-200/50 rounded-full animate-pulse" />
      </div>
      <div className="flex justify-center gap-[-20px] pb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="w-16 h-24 rounded-lg bg-red-400/40 animate-pulse shadow"
            style={{
              marginLeft: i > 0 ? "-30px" : 0,
              transform: `rotate(${-18 + i * 6}deg)`,
              zIndex: i,
            }}
          />
        ))}
      </div>
    </div>
  );
}
