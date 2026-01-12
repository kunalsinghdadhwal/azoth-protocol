// UNO Game Type Definitions for Confidential UNO

export enum GameStatus {
  NotStarted = 0,
  Started = 1,
  Ended = 2,
}

export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';

export type CardValue =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2'
  | 'wild' | 'wild4';

export interface UnoCard {
  id: number;
  color: CardColor;
  value: CardValue;
}

export interface GameState {
  id: bigint;
  players: `0x${string}`[];
  status: GameStatus;
  startTime: bigint;
  endTime: bigint;
  gameHash: `0x${string}`;
  moveCount: number;
  topCard: `0x${string}`;
  deckRemaining: number;
  currentPlayerIndex: number;
}

export interface PlayerState {
  hand: UnoCard[];
  handSize: number;
  isCurrentTurn: boolean;
  handHandle: `0x${string}`;
}

export interface GameListItem {
  id: bigint;
  players: `0x${string}`[];
  status: GameStatus;
  playerCount: number;
}

export interface SessionKeyState {
  ephemeralKeypair: unknown;
  voucher: unknown;
  expiresAt: Date;
  isActive: boolean;
}

export interface TransactionState {
  isLoading: boolean;
  txHash: `0x${string}` | null;
  error: string | null;
}

// Contract return types
export interface GetGameResult {
  id: bigint;
  players: readonly `0x${string}`[];
  status: number;
  startTime: bigint;
  endTime: bigint;
  gameHash: `0x${string}`;
  moveCount: number;
  topCard: `0x${string}`;
  deckRemaining: number;
  currentPlayerIndex: bigint;
}

// Card color mappings for classic wooden table theme
export const CARD_COLORS: Record<CardColor, { bg: string; border: string; text: string; shadow: string }> = {
  red: {
    bg: 'bg-red-600',
    border: 'border-red-700',
    text: 'text-white',
    shadow: 'shadow-md',
  },
  blue: {
    bg: 'bg-blue-600',
    border: 'border-blue-700',
    text: 'text-white',
    shadow: 'shadow-md',
  },
  green: {
    bg: 'bg-green-600',
    border: 'border-green-700',
    text: 'text-white',
    shadow: 'shadow-md',
  },
  yellow: {
    bg: 'bg-yellow-400',
    border: 'border-yellow-500',
    text: 'text-slate-900',
    shadow: 'shadow-md',
  },
  wild: {
    bg: 'bg-slate-900',
    border: 'border-slate-800',
    text: 'text-white',
    shadow: 'shadow-md',
  },
};

// Card value display mappings
export const CARD_VALUE_DISPLAY: Record<CardValue, string> = {
  '0': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  'skip': '⊘',
  'reverse': '⇄',
  'draw2': '+2',
  'wild': '✦',
  'wild4': '+4',
};

// Utility function to convert card ID to card object
export function cardIdToCard(id: number): UnoCard {
  // Wild cards (100-103)
  if (id >= 100 && id <= 103) {
    return { id, color: 'wild', value: 'wild' };
  }

  // Wild Draw Four cards (104-107)
  if (id >= 104 && id <= 107) {
    return { id, color: 'wild', value: 'wild4' };
  }

  // Color cards (0-99): 25 cards per color
  const colorIndex = Math.floor(id / 25);
  const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];
  const color = colors[colorIndex];

  const cardInColor = id % 25;

  // Card 0: Zero
  if (cardInColor === 0) {
    return { id, color, value: '0' };
  }

  // Cards 1-9: First set of 1-9
  if (cardInColor <= 9) {
    return { id, color, value: String(cardInColor) as CardValue };
  }

  // Cards 10-18: Second set of 1-9
  if (cardInColor <= 18) {
    return { id, color, value: String(cardInColor - 9) as CardValue };
  }

  // Cards 19-20: Skip (2 copies)
  if (cardInColor <= 20) {
    return { id, color, value: 'skip' };
  }

  // Cards 21-22: Reverse (2 copies)
  if (cardInColor <= 22) {
    return { id, color, value: 'reverse' };
  }

  // Cards 23-24: Draw Two (2 copies)
  return { id, color, value: 'draw2' };
}

// Check if a card can be played on top of another
export function canPlayCard(card: UnoCard, topCard: UnoCard): boolean {
  // Wild cards can always be played
  if (card.color === 'wild') {
    return true;
  }

  // Match by color or value
  return card.color === topCard.color || card.value === topCard.value;
}

// Format address for display
export function formatAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Check if address is the bot address
export function isBotAddress(address: string): boolean {
  return address.toLowerCase() === '0x0000000000000000000000000000000000000b07';
}
