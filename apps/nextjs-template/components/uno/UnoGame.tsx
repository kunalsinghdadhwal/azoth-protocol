"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { GameHeader } from "./GameHeader";
import { GameSidebar } from "./GameSidebar";
import { GameBoard, GameBoardSkeleton } from "./GameBoard";
import { GameLobby } from "./GameLobby";
import { GameResults } from "./GameResults";
import {
  useActiveGames,
  useNotStartedGames,
  useGameState,
  usePlayerHand,
  useTopCard,
  useUnoActions,
  useFees,
} from "@/utils/uno/hooks";
import { GameStatus, type UnoCard } from "@/utils/uno/types";
import { useSessionKeyContext } from "@/utils/uno/sessionContext";

export function UnoGame() {
  const { address, isConnected } = useAccount();
  const [currentGameId, setCurrentGameId] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Session key context for batch decryption
  const {
    sessionKey,
    isCreatingSession,
    sessionError,
    createSession,
    revokeSession,
    isSessionValid,
  } = useSessionKeyContext();

  // Track session validity with a timer to detect expiry
  const [sessionValidityCheck, setSessionValidityCheck] = useState(0);

  // Periodically check session validity (every 30 seconds)
  useEffect(() => {
    if (!sessionKey) return;

    const interval = setInterval(() => {
      // Force re-evaluation of session validity
      setSessionValidityCheck((prev) => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [sessionKey]);

  // Memoize session key params for hooks
  // Using sessionValidityCheck to properly react to session expiry
  const sessionKeyParams = useMemo(() => {
    if (sessionKey && sessionKey.expiresAt > new Date()) {
      return {
        keypair: sessionKey.keypair,
        voucher: sessionKey.voucher,
      };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey, sessionValidityCheck]);

  // Fetch game lists
  const { data: activeGames = [] } = useActiveGames();
  const { data: notStartedGames = [] } = useNotStartedGames();

  // Fetch current game state
  const { data: gameState, isLoading: gameStateLoading } = useGameState(currentGameId);

  // Fetch player hand with session key support
  const { hand, isDecrypting, refetchHand } = usePlayerHand(
    gameState?.status === GameStatus.Started ? currentGameId : null,
    sessionKeyParams
  );

  // Fetch top card with session key support
  const { topCard, isDecrypting: topCardDecrypting } = useTopCard(
    gameState?.topCard ?? null,
    gameState?.status ?? null,
    sessionKeyParams
  );

  // Fetch fees
  const { data: fees } = useFees();

  // Contract actions
  const {
    createGame,
    joinGame,
    startGame,
    playCard,
    drawCard,
    isCreating,
    isJoining,
    isStarting,
    isPlaying,
    isDrawing,
  } = useUnoActions();

  // Auto-select a game if player is in one
  useEffect(() => {
    if (!address || currentGameId) return;

    // Check active games first
    const playerActiveGame = activeGames.find((game) =>
      game.players.some((p) => p.toLowerCase() === address.toLowerCase())
    );
    if (playerActiveGame) {
      setCurrentGameId(playerActiveGame.id);
      return;
    }

    // Check not-started games
    const playerLobbyGame = notStartedGames.find((game) =>
      game.players.some((p) => p.toLowerCase() === address.toLowerCase())
    );
    if (playerLobbyGame) {
      setCurrentGameId(playerLobbyGame.id);
    }
  }, [address, activeGames, notStartedGames, currentGameId]);

  // Handlers
  const handleCreateGame = useCallback(
    async (isBot: boolean) => {
      setError(null);
      try {
        const gameId = await createGame(isBot);
        if (gameId) {
          setCurrentGameId(gameId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create game");
      }
    },
    [createGame]
  );

  const handleJoinGame = useCallback(
    async (gameId: bigint) => {
      setError(null);
      try {
        await joinGame(gameId);
        setCurrentGameId(gameId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to join game");
      }
    },
    [joinGame]
  );

  const handleStartGame = useCallback(async () => {
    if (!currentGameId) return;
    setError(null);
    try {
      await startGame(currentGameId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start game");
    }
  }, [currentGameId, startGame]);

  const handlePlayCard = useCallback(
    async (card: UnoCard) => {
      if (!currentGameId) return;
      setError(null);
      try {
        await playCard(currentGameId, card);
        // Refetch hand after playing
        setTimeout(() => refetchHand(), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to play card");
      }
    },
    [currentGameId, playCard, refetchHand]
  );

  const handleDrawCard = useCallback(async () => {
    if (!currentGameId) return;
    setError(null);
    try {
      await drawCard(currentGameId);
      // Refetch hand after drawing
      setTimeout(() => refetchHand(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to draw card");
    }
  }, [currentGameId, drawCard, refetchHand]);

  const handleSelectGame = useCallback((gameId: bigint) => {
    setCurrentGameId(gameId);
    setError(null);
  }, []);

  const handlePlayAgain = useCallback(() => {
    setCurrentGameId(null);
    setError(null);
  }, []);

  // Render main content based on game state
  const renderMainContent = () => {
    if (!isConnected) {
      return (
        <div className="flex-1 flex items-center justify-center bg-wood-table">
          <div className="text-center space-y-4 bg-white/90 p-8 rounded-2xl shadow-xl border-2 border-amber-700">
            <div className="size-16 mx-auto rounded-2xl bg-red-600 border-2 border-red-800 flex items-center justify-center shadow-md">
              <span
                className="text-yellow-400 text-xl font-black"
                style={{ transform: "rotate(-10deg)" }}
              >
                UNO
              </span>
            </div>
            <h2 className="text-2xl font-bold text-amber-900 text-balance">Confidential UNO</h2>
            <p className="text-amber-700 max-w-sm text-pretty">
              Connect your wallet to play encrypted UNO on the blockchain with privacy-preserving moves.
            </p>
          </div>
        </div>
      );
    }

    if (!currentGameId) {
      return (
        <div className="flex-1 flex items-center justify-center bg-wood-table">
          <div className="text-center space-y-4 bg-white/80 p-8 rounded-2xl shadow-lg border border-amber-400">
            <div className="size-16 mx-auto rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center">
              <span className="text-amber-600 text-3xl">🎴</span>
            </div>
            <h2 className="text-xl font-bold text-amber-900 text-balance">No Game Selected</h2>
            <p className="text-amber-700 max-w-sm text-pretty">
              Create a new game or join an existing one from the sidebar.
            </p>
          </div>
        </div>
      );
    }

    if (gameStateLoading) {
      return (
        <div className="flex-1">
          <GameBoardSkeleton />
        </div>
      );
    }

    if (!gameState) {
      return (
        <div className="flex-1 flex items-center justify-center bg-wood-table">
          <div className="text-center space-y-4 bg-white/80 p-6 rounded-xl shadow-lg border border-amber-400">
            <p className="text-amber-800 text-pretty">Game not found</p>
            <button
              type="button"
              onClick={handlePlayAgain}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      );
    }

    // Game not started - show lobby
    if (gameState.status === GameStatus.NotStarted) {
      return (
        <div className="flex-1">
          <GameLobby
            gameId={gameState.id}
            players={gameState.players}
            currentUserAddress={address}
            onStartGame={handleStartGame}
            isStarting={isStarting}
          />
        </div>
      );
    }

    // Game ended - show results
    if (gameState.status === GameStatus.Ended) {
      // TODO: Determine winner from game state
      const winner = null; // Would need to track this in contract or events
      return (
        <div className="flex-1">
          <GameResults
            gameId={gameState.id}
            players={gameState.players}
            winner={winner}
            currentUserAddress={address}
            gameHash={gameState.gameHash}
            onPlayAgain={handlePlayAgain}
          />
        </div>
      );
    }

    // Game in progress - show session key prompt if not initialized
    if (!sessionKeyParams && !isCreatingSession) {
      return (
        <div className="flex-1 flex items-center justify-center bg-wood-table">
          <div className="text-center space-y-6 bg-white/95 p-8 rounded-2xl shadow-xl border-2 border-amber-700 max-w-md">
            <div className="size-16 mx-auto rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center">
              <svg
                className="size-8 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-900 mb-2">
                Create Session Key
              </h2>
              <p className="text-amber-700 text-sm text-pretty">
                Sign once to create a session key that allows decrypting all your cards
                without signing each time. This session lasts for 1 hour.
              </p>
            </div>
            {sessionError && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {sessionError}
              </p>
            )}
            <button
              type="button"
              onClick={() => createSession()}
              disabled={isCreatingSession}
              className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-300 text-white font-semibold rounded-xl transition-colors shadow-md"
            >
              {isCreatingSession ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="size-5 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating Session...
                </span>
              ) : (
                "Create Session Key"
              )}
            </button>
          </div>
        </div>
      );
    }

    // Show loading while creating session
    if (isCreatingSession) {
      return (
        <div className="flex-1 flex items-center justify-center bg-wood-table">
          <div className="text-center space-y-4 bg-white/90 p-8 rounded-2xl shadow-xl border-2 border-amber-700">
            <svg className="size-12 mx-auto animate-spin text-amber-600" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-amber-800 font-medium">Creating session key...</p>
            <p className="text-amber-600 text-sm">Please sign the message in your wallet</p>
          </div>
        </div>
      );
    }

    // Game in progress - show board
    return (
      <div className="flex-1">
        <GameBoard
          gameState={gameState}
          playerHand={hand}
          topCard={topCard}
          currentPlayerAddress={address}
          onPlayCard={handlePlayCard}
          onDrawCard={handleDrawCard}
          isDrawing={isDrawing}
          isPlaying={isPlaying}
          isDecrypting={isDecrypting || topCardDecrypting}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-dvh bg-wood-table">
      {/* Header */}
      <GameHeader
        currentGameId={currentGameId}
        encryptionFee={fees?.encryption ?? 0n}
        sessionActive={isSessionValid()}
        sessionExpiresAt={sessionKey?.expiresAt ?? null}
        onRevokeSession={sessionKey ? revokeSession : undefined}
      />

      {/* Error banner */}
      {error && (
        <div className="px-6 py-3 bg-red-100 border-b-2 border-red-300">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
              aria-label="Dismiss error"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - games list */}
        {isConnected && (
          <GameSidebar
            activeGames={activeGames}
            notStartedGames={notStartedGames}
            currentGameId={currentGameId}
            onSelectGame={handleSelectGame}
            onCreateGame={handleCreateGame}
            onJoinGame={handleJoinGame}
            createGameFee={fees?.createBotGame ?? 0n}
            joinGameFee={fees?.joinGame ?? 0n}
            isCreating={isCreating}
            isJoining={isJoining}
            userAddress={address}
          />
        )}

        {/* Main content */}
        {renderMainContent()}
      </div>
    </div>
  );
}
