"use client";

import { type UnoCard, CARD_COLORS, CARD_VALUE_DISPLAY } from "@/utils/uno/types";

interface CardProps {
  card: UnoCard;
  onClick?: () => void;
  disabled?: boolean;
  isSelected?: boolean;
  size?: "sm" | "md" | "lg";
  faceDown?: boolean;
  rotation?: number;
}

export function Card({
  card,
  onClick,
  disabled = false,
  isSelected = false,
  size = "md",
  faceDown = false,
  rotation = 0,
}: CardProps) {
  const colors = CARD_COLORS[card.color];
  const displayValue = CARD_VALUE_DISPLAY[card.value];

  const sizeClasses = {
    sm: "w-12 h-[72px] text-sm",
    md: "w-16 h-24 text-base",
    lg: "w-20 h-[120px] text-lg",
  };

  const isSpecialCard = ["skip", "reverse", "draw2", "wild", "wild4"].includes(card.value);

  // Card back - classic red with UNO logo
  if (faceDown) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        style={{ transform: rotation ? `rotate(${rotation}deg)` : undefined }}
        className={`
          ${sizeClasses[size]}
          relative rounded-lg border-2 border-red-800
          bg-red-600
          flex items-center justify-center
          shadow-md
          transition-transform duration-150 ease-out
          ${!disabled ? "hover:shadow-lg cursor-pointer hover:-translate-y-1" : "opacity-50 cursor-not-allowed"}
          ${isSelected ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-amber-900 -translate-y-3 shadow-lg" : ""}
        `}
        aria-label="Face down card"
      >
        {/* Oval border pattern */}
        <div className="absolute inset-2 rounded-full border-[3px] border-white/80" />
        {/* UNO text */}
        <span
          className="relative z-10 text-yellow-400 font-black tracking-tight drop-shadow-md"
          style={{
            fontSize: size === "sm" ? "0.7rem" : size === "md" ? "0.9rem" : "1.1rem",
            transform: "rotate(-15deg)",
            textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
          }}
        >
          UNO
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{ transform: rotation ? `rotate(${rotation}deg)` : undefined }}
      className={`
        ${sizeClasses[size]}
        relative rounded-lg border-2 ${colors.border}
        ${colors.bg}
        flex items-center justify-center
        ${colors.shadow}
        transition-transform duration-150 ease-out
        ${!disabled ? "hover:shadow-lg cursor-pointer hover:-translate-y-1" : "opacity-50 cursor-not-allowed"}
        ${isSelected ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-amber-100 -translate-y-3 shadow-lg" : ""}
      `}
      aria-label={`${card.color} ${card.value} card`}
    >
      {/* White oval inner border for classic Uno look */}
      <div className="absolute inset-1.5 rounded-full border-2 border-white/50" />

      {/* Card content container */}
      <div className={`
        absolute inset-1 rounded
        flex flex-col items-center justify-between py-1
        ${colors.text}
      `}>
        {/* Top-left value */}
        <div className="self-start pl-1.5 font-bold text-xs drop-shadow">
          {displayValue}
        </div>

        {/* Center value */}
        <div className={`
          font-black drop-shadow-md ${isSpecialCard ? "text-xl" : "text-3xl"}
          ${card.color === "wild" ? "" : ""}
        `}>
          {displayValue}
        </div>

        {/* Bottom-right value (rotated) */}
        <div className="self-end pr-1.5 font-bold text-xs rotate-180 drop-shadow">
          {displayValue}
        </div>
      </div>

      {/* Wild card multi-color quadrants */}
      {card.color === "wild" && (
        <div className="absolute inset-3 rounded overflow-hidden opacity-60">
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-red-500" />
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500" />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-yellow-400" />
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-green-500" />
        </div>
      )}
    </button>
  );
}

// Mini card for showing opponent hands - small red card back
export function MiniCard({ count, vertical = false }: { count: number; vertical?: boolean }) {
  if (vertical) {
    // Vertical stack for side opponents
    return (
      <div className="flex flex-col items-center gap-0.5">
        {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
          <div
            key={i}
            className="w-8 h-5 rounded-sm bg-red-600 border border-red-800 shadow-sm flex items-center justify-center"
            style={{ marginTop: i > 0 ? "-12px" : 0, zIndex: i }}
          >
            {i === Math.min(count, 5) - 1 && (
              <span className="text-yellow-400 font-bold text-[6px]">UNO</span>
            )}
          </div>
        ))}
        <span className="text-amber-900 font-mono text-xs tabular-nums mt-1 bg-white/80 px-1 rounded">
          {count}
        </span>
      </div>
    );
  }

  // Horizontal row for top opponent
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: Math.min(count, 7) }).map((_, i) => (
        <div
          key={i}
          className="w-6 h-9 rounded-sm bg-red-600 border border-red-800 shadow-sm flex items-center justify-center"
          style={{ marginLeft: i > 0 ? "-16px" : 0, zIndex: i }}
        >
          <div className="w-4 h-6 rounded-full border border-white/60" />
        </div>
      ))}
      <span className="text-amber-900 font-mono text-sm tabular-nums ml-2 bg-white/80 px-1.5 py-0.5 rounded">
        x{count}
      </span>
    </div>
  );
}

// Card placeholder for empty slots
export function CardPlaceholder({ label }: { label?: string }) {
  return (
    <div className="w-16 h-24 rounded-lg border-2 border-dashed border-amber-700/50 bg-amber-900/20 flex items-center justify-center">
      {label && <span className="text-amber-800/70 text-xs text-center px-1 text-pretty">{label}</span>}
    </div>
  );
}

// Draw pile - stacked cards
export function DrawPile({
  count,
  onClick,
  disabled = false,
  isDrawing = false,
}: {
  count: number;
  onClick?: () => void;
  disabled?: boolean;
  isDrawing?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        group flex flex-col items-center gap-2
        ${!disabled ? "cursor-pointer" : "cursor-not-allowed opacity-60"}
      `}
      aria-label="Draw a card from the deck"
    >
      <div className="relative w-20 h-[120px]">
        {/* Stacked card effect */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`
              absolute w-full h-full rounded-lg bg-red-600 border-2 border-red-800 shadow-md
              transition-transform duration-150
              ${!disabled && i === 2 ? "group-hover:-translate-y-1 group-hover:shadow-lg" : ""}
            `}
            style={{
              top: -i * 2,
              left: -i * 1,
              zIndex: i,
            }}
          >
            {i === 2 && (
              <>
                <div className="absolute inset-2 rounded-full border-[3px] border-white/80" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-yellow-400 font-black text-lg drop-shadow-md"
                    style={{ transform: "rotate(-15deg)" }}
                  >
                    UNO
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
        {isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="size-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div className="text-center">
        <span className="text-amber-900 font-semibold text-sm">Draw</span>
        <p className="text-amber-800/70 text-xs tabular-nums">{count} left</p>
      </div>
    </button>
  );
}

// Discard pile - shows top card with slight rotation
export function DiscardPile({
  topCard,
  moveCount,
}: {
  topCard: UnoCard | null;
  moveCount: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-[120px]">
        {/* Background pile indication */}
        <div className="absolute inset-0 rounded-lg bg-amber-800/30 border-2 border-dashed border-amber-700/50" />
        {/* Top card with rotation */}
        {topCard && (
          <div
            className="absolute inset-0"
            style={{ transform: `rotate(${(moveCount % 20) * 3 - 30}deg)` }}
          >
            <Card card={topCard} size="lg" disabled />
          </div>
        )}
      </div>
      <div className="text-center">
        <span className="text-amber-900 font-semibold text-sm">Discard</span>
        <p className="text-amber-800/70 text-xs tabular-nums">{moveCount} played</p>
      </div>
    </div>
  );
}
