// UNO Game Contract Constants

export const UNO_GAME_ADDRESS = "0x5a81f4F50A6ACCA3965E4098E32f75E532556cDc" as const;

// Session key verifier address for Base Sepolia
export const SESSION_VERIFIER_ADDRESS = "0xc34569efc25901bdd6b652164a2c8a7228b23005" as const;

// Contract ABI - extracted from ConfidentialUnoGame.sol artifact
export const UNO_GAME_ABI = [
  {
    inputs: [
      { internalType: "uint16", name: "start", type: "uint16" },
      { internalType: "uint16", name: "end", type: "uint16" }
    ],
    name: "InvalidRange",
    type: "error"
  },
  {
    inputs: [
      { internalType: "uint16", name: "start", type: "uint16" },
      { internalType: "uint16", name: "end", type: "uint16" },
      { internalType: "uint16", name: "len", type: "uint16" }
    ],
    name: "SliceOutOfRange",
    type: "error"
  },
  {
    inputs: [{ internalType: "enum ETypes", name: "listType", type: "uint8" }],
    name: "UnsupportedListType",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "gameId", type: "uint256" },
      { indexed: true, internalType: "address", name: "player", type: "address" }
    ],
    name: "CardDrawn",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "gameId", type: "uint256" },
      { indexed: false, internalType: "address", name: "creator", type: "address" }
    ],
    name: "GameCreated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "gameId", type: "uint256" }
    ],
    name: "GameEnded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "gameId", type: "uint256" }
    ],
    name: "GameStarted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "gameId", type: "uint256" },
      { indexed: true, internalType: "address", name: "player", type: "address" }
    ],
    name: "MoveCommitted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "gameId", type: "uint256" },
      { indexed: false, internalType: "address", name: "player", type: "address" }
    ],
    name: "PlayerJoined",
    type: "event"
  },
  {
    inputs: [],
    name: "DECK_SIZE",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "INITIAL_HAND_SIZE",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "MAX_PLAYERS",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "gameId", type: "uint256" },
      { internalType: "bytes", name: "moveInput", type: "bytes" }
    ],
    name: "commitMove",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_creator", type: "address" },
      { internalType: "bool", name: "_isBot", type: "bool" }
    ],
    name: "createGame",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "gameId", type: "uint256" }],
    name: "drawCard",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "gameId", type: "uint256" },
      { internalType: "bytes", name: "gameHashInput", type: "bytes" }
    ],
    name: "endGame",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [],
    name: "getActiveGames",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "gameId", type: "uint256" },
      { internalType: "address", name: "player", type: "address" },
      { internalType: "uint16", name: "index", type: "uint16" }
    ],
    name: "getCardFromHand",
    outputs: [{ internalType: "euint256", name: "", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "bool", name: "isBot", type: "bool" }],
    name: "getCreateGameFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "gameId", type: "uint256" }],
    name: "getDeck",
    outputs: [{ internalType: "elist", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getEncryptionFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "gameId", type: "uint256" }],
    name: "getGame",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "address[]", name: "players", type: "address[]" },
      { internalType: "enum ConfidentialUnoGame.GameStatus", name: "status", type: "uint8" },
      { internalType: "uint256", name: "startTime", type: "uint256" },
      { internalType: "uint256", name: "endTime", type: "uint256" },
      { internalType: "euint256", name: "gameHash", type: "bytes32" },
      { internalType: "uint16", name: "moveCount", type: "uint16" },
      { internalType: "euint256", name: "topCard", type: "bytes32" },
      { internalType: "uint16", name: "deckRemaining", type: "uint16" },
      { internalType: "uint256", name: "currentPlayerIndex", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getJoinGameFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "gameId", type: "uint256" }],
    name: "getMoves",
    outputs: [{ internalType: "elist", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getNotStartedGames",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "gameId", type: "uint256" },
      { internalType: "address", name: "player", type: "address" }
    ],
    name: "getPlayerHand",
    outputs: [{ internalType: "elist", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "gameId", type: "uint256" },
      { internalType: "address", name: "player", type: "address" }
    ],
    name: "getPlayerHandSize",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "gameId", type: "uint256" },
      { internalType: "address", name: "_joinee", type: "address" }
    ],
    name: "joinGame",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "gameId", type: "uint256" }],
    name: "startGame",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
] as const;

// Game constants
export const DECK_SIZE = 108;
export const INITIAL_HAND_SIZE = 7;
export const MAX_PLAYERS = 10;
