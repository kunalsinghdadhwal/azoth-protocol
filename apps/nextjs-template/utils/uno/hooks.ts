"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UNO_GAME_ADDRESS, UNO_GAME_ABI } from "./constants";
import { type GameState, type UnoCard, GameStatus, cardIdToCard } from "./types";
import { encryptValue, decryptValue, decryptWithVoucher, type SessionKeypair } from "@/utils/inco";
import type { HexString } from "@inco/js";

// Hook to fetch active games
export function useActiveGames() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["uno", "activeGames"],
    queryFn: async () => {
      if (!publicClient) return [];

      const activeIds = await publicClient.readContract({
        address: UNO_GAME_ADDRESS,
        abi: UNO_GAME_ABI,
        functionName: "getActiveGames",
      }) as bigint[];

      const games = await Promise.all(
        activeIds.map(async (id) => {
          const game = await publicClient.readContract({
            address: UNO_GAME_ADDRESS,
            abi: UNO_GAME_ABI,
            functionName: "getGame",
            args: [id],
          }) as [bigint, readonly `0x${string}`[], number, bigint, bigint, `0x${string}`, number, `0x${string}`, number, bigint];

          return {
            id: game[0],
            players: game[1],
            status: game[2],
          };
        })
      );

      return games;
    },
    refetchInterval: 5000,
    enabled: !!publicClient,
  });
}

// Hook to fetch not-started games
export function useNotStartedGames() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["uno", "notStartedGames"],
    queryFn: async () => {
      if (!publicClient) return [];

      const notStartedIds = await publicClient.readContract({
        address: UNO_GAME_ADDRESS,
        abi: UNO_GAME_ABI,
        functionName: "getNotStartedGames",
      }) as bigint[];

      const games = await Promise.all(
        notStartedIds.map(async (id) => {
          const game = await publicClient.readContract({
            address: UNO_GAME_ADDRESS,
            abi: UNO_GAME_ABI,
            functionName: "getGame",
            args: [id],
          }) as [bigint, readonly `0x${string}`[], number, bigint, bigint, `0x${string}`, number, `0x${string}`, number, bigint];

          return {
            id: game[0],
            players: game[1],
            status: game[2],
          };
        })
      );

      return games;
    },
    refetchInterval: 5000,
    enabled: !!publicClient,
  });
}

// Hook to fetch game state
export function useGameState(gameId: bigint | null) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["uno", "gameState", gameId?.toString()],
    queryFn: async (): Promise<GameState | null> => {
      if (!publicClient || !gameId) return null;

      const game = await publicClient.readContract({
        address: UNO_GAME_ADDRESS,
        abi: UNO_GAME_ABI,
        functionName: "getGame",
        args: [gameId],
      }) as [bigint, readonly `0x${string}`[], number, bigint, bigint, `0x${string}`, number, `0x${string}`, number, bigint];

      return {
        id: game[0],
        players: game[1] as `0x${string}`[],
        status: game[2] as GameStatus,
        startTime: game[3],
        endTime: game[4],
        gameHash: game[5],
        moveCount: game[6],
        topCard: game[7],
        deckRemaining: game[8],
        currentPlayerIndex: Number(game[9]),
      };
    },
    refetchInterval: 3000,
    enabled: !!publicClient && !!gameId,
  });
}

// Session key parameters for decryption
interface SessionKeyParams {
  keypair: SessionKeypair;
  voucher: unknown;
}

// Hook to decrypt player's hand - supports both regular and session key decryption
export function usePlayerHand(
  gameId: bigint | null,
  sessionKey?: SessionKeyParams | null
) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [hand, setHand] = useState<UnoCard[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const decryptionInProgress = useRef(false);
  // Track if we've already decrypted with session key to avoid duplicate calls
  const hasDecryptedWithSession = useRef(false);

  const decryptHand = useCallback(async () => {
    if (!publicClient || !gameId || !address) {
      console.log("[PlayerHand] Missing dependencies:", {
        publicClient: !!publicClient,
        gameId: gameId?.toString(),
        address,
      });
      return;
    }

    // Need either session key or wallet client for decryption
    if (!sessionKey && !walletClient) {
      console.log("[PlayerHand] No session key or wallet client available");
      return;
    }

    // Prevent concurrent decryption attempts
    if (decryptionInProgress.current) {
      console.log("[PlayerHand] Decryption already in progress, skipping");
      return;
    }

    decryptionInProgress.current = true;
    setIsDecrypting(true);
    setError(null);

    try {
      // Get hand size first
      console.log("[PlayerHand] Fetching hand size for game:", gameId.toString());
      const handSize = await publicClient.readContract({
        address: UNO_GAME_ADDRESS,
        abi: UNO_GAME_ABI,
        functionName: "getPlayerHandSize",
        args: [gameId, address],
      }) as number;

      console.log("[PlayerHand] Hand size:", handSize);

      if (handSize === 0) {
        console.log("[PlayerHand] Hand is empty");
        setHand([]);
        setIsDecrypting(false);
        decryptionInProgress.current = false;
        return;
      }

      // Collect all card handles first
      const handles: HexString[] = [];
      for (let i = 0; i < handSize; i++) {
        try {
          console.log(`[PlayerHand] Getting handle for card ${i}/${handSize}...`);

          const { result: cardHandle } = await publicClient.simulateContract({
            address: UNO_GAME_ADDRESS,
            abi: UNO_GAME_ABI,
            functionName: "getCardFromHand",
            args: [gameId, address, i],
            account: address,
          });

          handles.push(cardHandle as HexString);
          console.log(`[PlayerHand] Card ${i} handle:`, cardHandle);
        } catch (handleError) {
          console.error(`[PlayerHand] Failed to get handle for card ${i}:`, handleError);
          handles.push("0x0000000000000000000000000000000000000000000000000000000000000000" as HexString);
        }
      }

      let cardValues: bigint[];

      // Use session key if available (no signature required per card)
      if (sessionKey) {
        console.log("[PlayerHand] Using session key for batch decryption...");
        try {
          cardValues = await decryptWithVoucher({
            keypair: sessionKey.keypair,
            voucher: sessionKey.voucher,
            publicClient,
            handles,
          });
          console.log("[PlayerHand] Session key decryption successful!");
        } catch (sessionError) {
          console.error("[PlayerHand] Session key decryption failed:", sessionError);
          // Fall back to individual decryption if session key fails
          if (walletClient) {
            console.log("[PlayerHand] Falling back to individual decryption...");
            cardValues = [];
            for (const handle of handles) {
              try {
                const value = await decryptValue({
                  walletClient,
                  handle,
                  contractAddress: UNO_GAME_ADDRESS,
                });
                cardValues.push(value);
              } catch {
                cardValues.push(-1n);
              }
            }
          } else {
            throw sessionError;
          }
        }
      } else if (walletClient) {
        // Fall back to individual decryption (requires signature per card)
        console.log("[PlayerHand] Using individual decryption (session key not available)...");
        cardValues = [];
        for (let i = 0; i < handles.length; i++) {
          try {
            console.log(`[PlayerHand] Decrypting card ${i}...`);
            const value = await decryptValue({
              walletClient,
              handle: handles[i],
              contractAddress: UNO_GAME_ADDRESS,
            });
            cardValues.push(value);
          } catch (cardError) {
            console.error(`[PlayerHand] Failed to decrypt card ${i}:`, cardError);
            cardValues.push(-1n);
          }
        }
      } else {
        throw new Error("No decryption method available");
      }

      // Convert card values to UnoCard objects
      const decryptedCards: UnoCard[] = [];
      const failedCards: number[] = [];

      for (let i = 0; i < cardValues.length; i++) {
        if (cardValues[i] === -1n) {
          failedCards.push(i);
          // Use wild card as placeholder for failed decryptions
          decryptedCards.push({
            id: -1,
            color: "wild",
            value: "wild",
          });
        } else {
          const card = cardIdToCard(Number(cardValues[i]));
          decryptedCards.push(card);
          console.log(`[PlayerHand] Card ${i} value:`, cardValues[i].toString());
        }
      }

      console.log(
        `[PlayerHand] Decryption complete. Success: ${handSize - failedCards.length}, Failed: ${failedCards.length}`
      );
      if (failedCards.length > 0) {
        console.warn("[PlayerHand] Failed card indices:", failedCards);
        setError(`Failed to decrypt ${failedCards.length} card(s). ACL may not be set.`);
      }

      setHand(decryptedCards);
    } catch (err) {
      console.error("[PlayerHand] Failed to decrypt hand:", err);
      setError(err instanceof Error ? err.message : "Failed to decrypt hand");
    } finally {
      setIsDecrypting(false);
      decryptionInProgress.current = false;
    }
  }, [publicClient, walletClient, gameId, address, sessionKey]);

  // Auto-decrypt when game ID changes or session key becomes available
  useEffect(() => {
    if (!gameId || !address) return;
    if (!walletClient && !sessionKey) return;

    // If session key just became available and we haven't decrypted with it yet
    const shouldDecrypt =
      !hasDecryptedWithSession.current ||
      hand.length === 0 ||
      // Re-decrypt if session key status changed
      (sessionKey && !hasDecryptedWithSession.current);

    if (shouldDecrypt) {
      console.log("[PlayerHand] Auto-triggering decryption for game:", gameId.toString());
      if (sessionKey) {
        hasDecryptedWithSession.current = true;
      }
      decryptHand();
    }
  }, [gameId, address, walletClient, sessionKey, decryptHand, hand.length]);

  // Reset session tracking when game changes
  useEffect(() => {
    hasDecryptedWithSession.current = false;
  }, [gameId]);

  return {
    hand,
    isDecrypting,
    error,
    refetchHand: decryptHand,
  };
}

// Hook to decrypt top card - supports both regular and session key decryption
export function useTopCard(
  topCardHandle: `0x${string}` | null,
  gameStatus: GameStatus | null,
  sessionKey?: SessionKeyParams | null
) {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [topCard, setTopCard] = useState<UnoCard | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    const decryptTopCard = async () => {
      const zeroHandle = "0x0000000000000000000000000000000000000000000000000000000000000000";

      if (!topCardHandle || topCardHandle === zeroHandle) {
        setTopCard(null);
        return;
      }

      if (gameStatus !== GameStatus.Started && gameStatus !== GameStatus.Ended) {
        setTopCard(null);
        return;
      }

      // Need either session key or wallet client
      if (!sessionKey && !walletClient) {
        return;
      }

      setIsDecrypting(true);
      try {
        let cardValue: bigint;

        if (sessionKey && publicClient) {
          // Use session key for decryption (no signature required)
          console.log("[TopCard] Using session key for decryption...");
          const values = await decryptWithVoucher({
            keypair: sessionKey.keypair,
            voucher: sessionKey.voucher,
            publicClient,
            handles: [topCardHandle as HexString],
          });
          cardValue = values[0];
        } else if (walletClient) {
          // Fall back to regular decryption
          console.log("[TopCard] Using regular decryption...");
          cardValue = await decryptValue({
            walletClient,
            handle: topCardHandle,
            contractAddress: UNO_GAME_ADDRESS,
          });
        } else {
          throw new Error("No decryption method available");
        }

        setTopCard(cardIdToCard(Number(cardValue)));
      } catch (err) {
        console.error("[TopCard] Failed to decrypt:", err);
      } finally {
        setIsDecrypting(false);
      }
    };

    decryptTopCard();
  }, [walletClient, publicClient, topCardHandle, gameStatus, sessionKey]);

  return { topCard, isDecrypting };
}

// Hook for contract write operations
export function useUnoActions() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const createGame = useCallback(
    async (isBot: boolean): Promise<bigint | null> => {
      if (!walletClient || !address || !publicClient) return null;

      setIsCreating(true);
      try {
        const fee = await publicClient.readContract({
          address: UNO_GAME_ADDRESS,
          abi: UNO_GAME_ABI,
          functionName: "getCreateGameFee",
          args: [isBot],
        }) as bigint;

        const hash = await walletClient.writeContract({
          address: UNO_GAME_ADDRESS,
          abi: UNO_GAME_ABI,
          functionName: "createGame",
          args: [address, isBot],
          value: fee,
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        // Parse GameCreated event to get game ID
        const gameCreatedLog = receipt.logs.find((log) => {
          try {
            return log.topics[0] === "0xc3e0f84839dc888c892a013d10c8f9d6dc05a21a879d0ce468ca558013e9121c";
          } catch {
            return false;
          }
        });

        const gameId = gameCreatedLog?.topics[1]
          ? BigInt(gameCreatedLog.topics[1])
          : null;

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ["uno", "activeGames"] });
        queryClient.invalidateQueries({ queryKey: ["uno", "notStartedGames"] });

        return gameId;
      } catch (err) {
        console.error("[CreateGame] Failed:", err);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [walletClient, address, publicClient, queryClient]
  );

  const joinGame = useCallback(
    async (gameId: bigint): Promise<void> => {
      if (!walletClient || !address || !publicClient) return;

      setIsJoining(true);
      try {
        const fee = await publicClient.readContract({
          address: UNO_GAME_ADDRESS,
          abi: UNO_GAME_ABI,
          functionName: "getJoinGameFee",
        }) as bigint;

        const hash = await walletClient.writeContract({
          address: UNO_GAME_ADDRESS,
          abi: UNO_GAME_ABI,
          functionName: "joinGame",
          args: [gameId, address],
          value: fee,
        });

        await publicClient.waitForTransactionReceipt({ hash });

        queryClient.invalidateQueries({ queryKey: ["uno", "activeGames"] });
        queryClient.invalidateQueries({ queryKey: ["uno", "notStartedGames"] });
        queryClient.invalidateQueries({ queryKey: ["uno", "gameState", gameId.toString()] });
      } catch (err) {
        console.error("[JoinGame] Failed:", err);
        throw err;
      } finally {
        setIsJoining(false);
      }
    },
    [walletClient, address, publicClient, queryClient]
  );

  const startGame = useCallback(
    async (gameId: bigint): Promise<void> => {
      if (!walletClient || !publicClient) return;

      setIsStarting(true);
      try {
        const hash = await walletClient.writeContract({
          address: UNO_GAME_ADDRESS,
          abi: UNO_GAME_ABI,
          functionName: "startGame",
          args: [gameId],
        });

        await publicClient.waitForTransactionReceipt({ hash });

        queryClient.invalidateQueries({ queryKey: ["uno", "activeGames"] });
        queryClient.invalidateQueries({ queryKey: ["uno", "notStartedGames"] });
        queryClient.invalidateQueries({ queryKey: ["uno", "gameState", gameId.toString()] });
      } catch (err) {
        console.error("[StartGame] Failed:", err);
        throw err;
      } finally {
        setIsStarting(false);
      }
    },
    [walletClient, publicClient, queryClient]
  );

  const playCard = useCallback(
    async (gameId: bigint, card: UnoCard): Promise<void> => {
      if (!walletClient || !address || !publicClient) return;

      setIsPlaying(true);
      try {
        const fee = await publicClient.readContract({
          address: UNO_GAME_ADDRESS,
          abi: UNO_GAME_ABI,
          functionName: "getEncryptionFee",
        }) as bigint;

        // Encrypt the card ID
        const encryptedMove = await encryptValue({
          value: BigInt(card.id),
          address,
          contractAddress: UNO_GAME_ADDRESS,
        });

        const hash = await walletClient.writeContract({
          address: UNO_GAME_ADDRESS,
          abi: UNO_GAME_ABI,
          functionName: "commitMove",
          args: [gameId, encryptedMove],
          value: fee,
        });

        await publicClient.waitForTransactionReceipt({ hash });

        queryClient.invalidateQueries({ queryKey: ["uno", "gameState", gameId.toString()] });
      } catch (err) {
        console.error("[PlayCard] Failed:", err);
        throw err;
      } finally {
        setIsPlaying(false);
      }
    },
    [walletClient, address, publicClient, queryClient]
  );

  const drawCard = useCallback(
    async (gameId: bigint): Promise<void> => {
      if (!walletClient || !publicClient) return;

      setIsDrawing(true);
      try {
        const fee = await publicClient.readContract({
          address: UNO_GAME_ADDRESS,
          abi: UNO_GAME_ABI,
          functionName: "getEncryptionFee",
        }) as bigint;

        const hash = await walletClient.writeContract({
          address: UNO_GAME_ADDRESS,
          abi: UNO_GAME_ABI,
          functionName: "drawCard",
          args: [gameId],
          value: fee,
        });

        await publicClient.waitForTransactionReceipt({ hash });

        queryClient.invalidateQueries({ queryKey: ["uno", "gameState", gameId.toString()] });
      } catch (err) {
        console.error("[DrawCard] Failed:", err);
        throw err;
      } finally {
        setIsDrawing(false);
      }
    },
    [walletClient, publicClient, queryClient]
  );

  const endGame = useCallback(
    async (gameId: bigint): Promise<void> => {
      if (!walletClient || !address || !publicClient) return;

      setIsEnding(true);
      try {
        const fee = await publicClient.readContract({
          address: UNO_GAME_ADDRESS,
          abi: UNO_GAME_ABI,
          functionName: "getEncryptionFee",
        }) as bigint;

        // Encrypt a game hash (using timestamp as simple hash)
        const encryptedHash = await encryptValue({
          value: BigInt(Date.now()),
          address,
          contractAddress: UNO_GAME_ADDRESS,
        });

        const hash = await walletClient.writeContract({
          address: UNO_GAME_ADDRESS,
          abi: UNO_GAME_ABI,
          functionName: "endGame",
          args: [gameId, encryptedHash],
          value: fee,
        });

        await publicClient.waitForTransactionReceipt({ hash });

        queryClient.invalidateQueries({ queryKey: ["uno", "activeGames"] });
        queryClient.invalidateQueries({ queryKey: ["uno", "gameState", gameId.toString()] });
      } catch (err) {
        console.error("[EndGame] Failed:", err);
        throw err;
      } finally {
        setIsEnding(false);
      }
    },
    [walletClient, address, publicClient, queryClient]
  );

  return {
    createGame,
    joinGame,
    startGame,
    playCard,
    drawCard,
    endGame,
    isCreating,
    isJoining,
    isStarting,
    isPlaying,
    isDrawing,
    isEnding,
  };
}

// Hook to get fees
export function useFees() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["uno", "fees"],
    queryFn: async () => {
      if (!publicClient) return { createGame: 0n, createBotGame: 0n, joinGame: 0n, encryption: 0n };

      const [createGameFee, createBotGameFee, joinGameFee, encryptionFee] = await Promise.all([
        publicClient.readContract({
          address: UNO_GAME_ADDRESS,
          abi: UNO_GAME_ABI,
          functionName: "getCreateGameFee",
          args: [false],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: UNO_GAME_ADDRESS,
          abi: UNO_GAME_ABI,
          functionName: "getCreateGameFee",
          args: [true],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: UNO_GAME_ADDRESS,
          abi: UNO_GAME_ABI,
          functionName: "getJoinGameFee",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: UNO_GAME_ADDRESS,
          abi: UNO_GAME_ABI,
          functionName: "getEncryptionFee",
        }) as Promise<bigint>,
      ]);

      return {
        createGame: createGameFee,
        createBotGame: createBotGameFee,
        joinGame: joinGameFee,
        encryption: encryptionFee,
      };
    },
    staleTime: 60000, // 1 minute
    enabled: !!publicClient,
  });
}
