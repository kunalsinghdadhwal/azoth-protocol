import { createPublicClient, createWalletClient, http, formatEther } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { Lightning } from "@inco/js/lite";
import * as dotenv from "dotenv";

dotenv.config();

const UNO_GAME_ADDRESS = "0x5a81f4F50A6ACCA3965E4098E32f75E532556cDc" as const;

const UNO_GAME_ABI = [
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

// Card ID to card info (simplified version)
function cardIdToInfo(cardId: number): string {
  if (cardId < 0) return "Unknown";
  if (cardId < 100) {
    const color = ["Red", "Yellow", "Green", "Blue"][Math.floor(cardId / 25)];
    const value = cardId % 10;
    return `${color} ${value}`;
  }
  const specials = ["Skip", "Reverse", "Draw Two", "Wild", "Wild Draw Four"];
  return specials[cardId - 100] || "Special";
}

async function main() {
  let privateKey = process.env.PRIVATE_KEY_BASE_SEPOLIA;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY_BASE_SEPOLIA not set in .env");
  }
  if (!privateKey.startsWith("0x")) {
    privateKey = `0x${privateKey}`;
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  console.log("Testing decryption with account:", account.address);

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  });

  // Initialize Inco Lightning
  console.log("\nInitializing Inco Lightning SDK...");
  const zap = await Lightning.latest("testnet", baseSepolia.id);
  console.log("Inco executor address:", zap.executorAddress);

  // Get active games
  const activeGames = await publicClient.readContract({
    address: UNO_GAME_ADDRESS,
    abi: UNO_GAME_ABI,
    functionName: "getActiveGames",
  });

  if (activeGames.length === 0) {
    console.log("No active games found. Please create a game first.");
    return;
  }

  const gameId = activeGames[activeGames.length - 1];
  console.log("\n--- Testing decryption for game:", gameId.toString(), "---");

  // Get hand size
  const handSize = await publicClient.readContract({
    address: UNO_GAME_ADDRESS,
    abi: UNO_GAME_ABI,
    functionName: "getPlayerHandSize",
    args: [gameId, account.address],
  });
  console.log("Hand size:", handSize);

  if (handSize === 0) {
    console.log("No cards in hand.");
    return;
  }

  // Get first few card handles and try to decrypt
  console.log("\n--- Attempting to decrypt cards ---");
  const cardsToDecrypt = Math.min(Number(handSize), 7);

  for (let i = 0; i < cardsToDecrypt; i++) {
    try {
      // Get card handle
      console.log(`\nCard ${i}: Getting handle...`);
      const { result: cardHandle } = await publicClient.simulateContract({
        address: UNO_GAME_ADDRESS,
        abi: UNO_GAME_ABI,
        functionName: "getCardFromHand",
        args: [gameId, account.address, i],
        account: account.address,
      });
      console.log(`Card ${i}: Handle = ${cardHandle}`);

      // Try to decrypt using Inco SDK
      console.log(`Card ${i}: Attempting decryption...`);
      const result = await zap.attestedDecrypt(
        walletClient,
        [cardHandle as `0x${string}`]
      );

      const decryptedValue = result[0].plaintext.value as bigint;
      console.log(`Card ${i}: Decrypted value = ${decryptedValue} (${cardIdToInfo(Number(decryptedValue))})`);
    } catch (err: any) {
      console.error(`Card ${i}: Decryption FAILED!`);
      console.error(`  Error: ${err.message || err}`);

      if (err.message?.includes("acl disallowed")) {
        console.error("  → ACL not set for this handle. The contract may not have granted access.");
      }
    }
  }

  console.log("\n✅ Decryption test complete!");
}

main().catch(console.error);
