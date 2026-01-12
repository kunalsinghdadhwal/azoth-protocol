import { createPublicClient, createWalletClient, http, formatEther } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";

dotenv.config();

const UNO_GAME_ADDRESS = "0x5a81f4F50A6ACCA3965E4098E32f75E532556cDc" as const;

const UNO_GAME_ABI = [
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
    inputs: [{ internalType: "bool", name: "isBot", type: "bool" }],
    name: "getCreateGameFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
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
      { internalType: "address", name: "player", type: "address" },
      { internalType: "uint16", name: "index", type: "uint16" }
    ],
    name: "getCardFromHand",
    outputs: [{ internalType: "euint256", name: "", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function"
  },
] as const;

async function main() {
  let privateKey = process.env.PRIVATE_KEY_BASE_SEPOLIA;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY_BASE_SEPOLIA not set in .env");
  }

  // Add 0x prefix if missing
  if (!privateKey.startsWith("0x")) {
    privateKey = `0x${privateKey}`;
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  console.log("Testing with account:", account.address);

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  });

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Balance:", formatEther(balance), "ETH");

  // Get create game fee
  const fee = await publicClient.readContract({
    address: UNO_GAME_ADDRESS,
    abi: UNO_GAME_ABI,
    functionName: "getCreateGameFee",
    args: [true], // bot game
  });
  console.log("Create game fee:", formatEther(fee), "ETH");

  // Get active games
  const activeGames = await publicClient.readContract({
    address: UNO_GAME_ADDRESS,
    abi: UNO_GAME_ABI,
    functionName: "getActiveGames",
  });
  console.log("Active games:", activeGames.length);

  if (activeGames.length > 0) {
    const gameId = activeGames[activeGames.length - 1];
    console.log("\n--- Checking latest game:", gameId.toString(), "---");

    // Get game details
    const game = await publicClient.readContract({
      address: UNO_GAME_ADDRESS,
      abi: UNO_GAME_ABI,
      functionName: "getGame",
      args: [gameId],
    });

    console.log("Game ID:", game[0].toString());
    console.log("Players:", game[1]);
    console.log("Status:", ["NotStarted", "Started", "Ended"][game[2]]);
    console.log("Move count:", game[6]);
    console.log("Top card handle:", game[7]);
    console.log("Deck remaining:", game[8]);
    console.log("Current player index:", game[9].toString());

    // Check if our account is a player
    const isPlayer = game[1].some(
      (p) => p.toLowerCase() === account.address.toLowerCase()
    );
    console.log("Is our account a player?", isPlayer);

    if (isPlayer) {
      // Get hand size
      const handSize = await publicClient.readContract({
        address: UNO_GAME_ADDRESS,
        abi: UNO_GAME_ABI,
        functionName: "getPlayerHandSize",
        args: [gameId, account.address],
      });
      console.log("Hand size:", handSize);

      // Try to simulate getting card handles
      console.log("\n--- Simulating getCardFromHand ---");
      for (let i = 0; i < Math.min(handSize, 3); i++) {
        try {
          const { result: cardHandle } = await publicClient.simulateContract({
            address: UNO_GAME_ADDRESS,
            abi: UNO_GAME_ABI,
            functionName: "getCardFromHand",
            args: [gameId, account.address, i],
            account: account.address,
          });
          console.log(`Card ${i} handle:`, cardHandle);
        } catch (err) {
          console.error(`Failed to get card ${i}:`, err);
        }
      }
    }
  }

  // Create a new bot game for testing
  console.log("\n--- Creating new bot game ---");
  try {
    const hash = await walletClient.writeContract({
      address: UNO_GAME_ADDRESS,
      abi: UNO_GAME_ABI,
      functionName: "createGame",
      args: [account.address, true],
      value: fee,
    });
    console.log("Transaction hash:", hash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("Transaction status:", receipt.status);
    console.log("Gas used:", receipt.gasUsed.toString());

    // Parse GameCreated event
    const gameCreatedLog = receipt.logs.find((log) => {
      return log.topics[0] === "0xc3e0f84839dc888c892a013d10c8f9d6dc05a21a879d0ce468ca558013e9121c";
    });
    const newGameId = gameCreatedLog?.topics[1]
      ? BigInt(gameCreatedLog.topics[1])
      : null;
    console.log("New game ID:", newGameId?.toString());

    if (newGameId) {
      // Wait a bit for Inco operations to complete
      console.log("Waiting 3 seconds for Inco operations...");
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get full game state
      const gameState = await publicClient.readContract({
        address: UNO_GAME_ADDRESS,
        abi: UNO_GAME_ABI,
        functionName: "getGame",
        args: [newGameId],
      });
      console.log("\nGame state:");
      console.log("  ID:", gameState[0].toString());
      console.log("  Players:", gameState[1]);
      console.log("  Status:", ["NotStarted", "Started", "Ended"][gameState[2]]);
      console.log("  Deck remaining:", gameState[8]);
      console.log("  Current player:", gameState[9].toString());
      console.log("  Top card handle:", gameState[7]);

      // Get hand size for new game
      const handSize = await publicClient.readContract({
        address: UNO_GAME_ADDRESS,
        abi: UNO_GAME_ABI,
        functionName: "getPlayerHandSize",
        args: [newGameId, account.address],
      });
      console.log("\nHand size for", account.address, ":", handSize);

      // Also check bot's hand size
      const botAddress = "0x0000000000000000000000000000000000000B07";
      const botHandSize = await publicClient.readContract({
        address: UNO_GAME_ADDRESS,
        abi: UNO_GAME_ABI,
        functionName: "getPlayerHandSize",
        args: [newGameId, botAddress],
      });
      console.log("Bot hand size:", botHandSize);

      if (handSize === 0) {
        console.log("\n⚠️  Hand size is 0 - this indicates an issue with card dealing!");
        console.log("Check if _dealInitialHands is being called correctly.");
      }

      // Try to get card handles
      console.log("\n--- Getting card handles for new game ---");
      for (let i = 0; i < Math.min(Number(handSize) || 7, 7); i++) {
        try {
          const { result: cardHandle } = await publicClient.simulateContract({
            address: UNO_GAME_ADDRESS,
            abi: UNO_GAME_ABI,
            functionName: "getCardFromHand",
            args: [newGameId, account.address, i],
            account: account.address,
          });
          console.log(`Card ${i} handle:`, cardHandle);
        } catch (err: any) {
          console.error(`Failed to get card ${i}:`, err.message || err);
        }
      }
    }
  } catch (err) {
    console.error("Failed to create game:", err);
  }

  console.log("\n✅ Test complete!");
}

main().catch(console.error);
