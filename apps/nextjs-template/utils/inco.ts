import { AttestedComputeSupportedOps, Lightning, generateSecp256k1Keypair } from "@inco/js/lite";
import { handleTypes, type HexString } from "@inco/js";
import type { WalletClient, Transport, Account, Chain, PublicClient } from "viem";
import { bytesToHex, createPublicClient, http, pad, toHex } from "viem";
import { baseSepolia } from "viem/chains";

export type IncoWalletClient = WalletClient<Transport, Chain, Account>;
export type SessionKeypair = ReturnType<typeof generateSecp256k1Keypair>;

const ZERO_HANDLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export async function getConfig() {
  const chainId = publicClient.chain.id;
  console.log("[Config] Chain ID:", chainId);
  
  try {
    const config = await Lightning.latest("testnet", chainId);
    console.log("[Config] Inco Executor Address:", config.executorAddress);
    return config;
  } catch (error) {
    console.error("[Config] Failed to get Inco config:", error);
    throw error;
  }
}

export function isValidHandle(handle: string): boolean {
  return handle !== ZERO_HANDLE && handle !== "0x" && handle.length === 66;
}

export async function encryptValue({
  value,
  address,
  contractAddress,
}: {
  value: bigint;
  address: `0x${string}`;
  contractAddress: `0x${string}`;
}): Promise<`0x${string}`> {
  console.log("[Encrypt] Starting encryption...");
  console.log("[Encrypt] Value:", value.toString());
  console.log("[Encrypt] Account:", address);
  console.log("[Encrypt] Contract:", contractAddress);
  
  const inco = await getConfig();

  try {
    const encryptedData = await inco.encrypt(value, {
      accountAddress: address,
      dappAddress: contractAddress,
      handleType: handleTypes.euint256,
    });

    console.log("[Encrypt] Success!");
    return encryptedData as `0x${string}`;
  } catch (error) {
    console.error("[Encrypt] Failed:", error);
    throw error;
  }
}

export async function decryptValue({
  walletClient,
  handle,
  contractAddress,
}: {
  walletClient: IncoWalletClient;
  handle: string;
  contractAddress?: `0x${string}`;
}): Promise<bigint> {
  console.log("[Decrypt] Starting decryption...");
  console.log("[Decrypt] Handle:", handle);
  console.log("[Decrypt] User address:", walletClient.account?.address);
  if (contractAddress) {
    console.log("[Decrypt] Contract:", contractAddress);
  }
  
  if (handle === ZERO_HANDLE) {
    console.log("[Decrypt] Handle is zero, returning 0");
    return 0n;
  }
  
  const inco = await getConfig();

  const backoffConfig = {
    maxRetries: 10,
    initialDelay: 3000,
    maxDelay: 30000
  };

  try {
    console.log("[Decrypt] Calling attestedDecrypt...");
    const attestedDecrypt = await inco.attestedDecrypt(
      walletClient, 
      [handle as `0x${string}`],
      backoffConfig
    );

    const value = attestedDecrypt[0].plaintext.value as bigint;
    console.log("[Decrypt] Success! Value:", value.toString());
    return value;
  } catch (error: unknown) {
    console.error("[Decrypt] Failed:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("acl disallowed")) {
      console.error("[Decrypt] ACL Error: User is not allowed to decrypt this handle");
      console.error("[Decrypt] Possible causes:");
      console.error("   1. You haven't purchased any cUSDC yet");
      console.error("   2. The contract didn't call .allow(yourAddress) on this handle");
      console.error("   3. The handle belongs to a different user");
    }
    
    throw error;
  }
}

export const attestedCompute = async ({
  walletClient,
  lhsHandle,
  op,
  rhsPlaintext,
}: {
  walletClient: IncoWalletClient;
  lhsHandle: `0x${string}`;
  op: (typeof AttestedComputeSupportedOps)[keyof typeof AttestedComputeSupportedOps];
  rhsPlaintext: bigint | boolean;
}) => {
  const incoConfig = await getConfig();

  const result = await incoConfig.attestedCompute(
    walletClient,
    lhsHandle as `0x${string}`,
    op,
    rhsPlaintext
  );

  const signatures = result.covalidatorSignatures.map((sig: Uint8Array) =>
    bytesToHex(sig)
  );

  const encodedValue = pad(toHex(result.plaintext.value ? 1 : 0), { size: 32 });

  return {
    plaintext: result.plaintext.value,
    attestation: {
      handle: result.handle,
      value: encodedValue,
    },
    signature: signatures,
  };
};

export async function getFee(): Promise<bigint> {
  console.log("[Fee] Fetching Inco fee...");

  const inco = await getConfig();

  try {
    const fee = await publicClient.readContract({
      address: inco.executorAddress,
      abi: [
        {
          type: "function",
          inputs: [],
          name: "getFee",
          outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
          stateMutability: "pure",
        },
      ],
      functionName: "getFee",
    });

    console.log("[Fee] Got fee:", fee.toString(), "wei");
    return fee;
  } catch (error) {
    console.error("[Fee] Failed to get fee:", error);
    throw error;
  }
}

// Decrypt multiple handles using a session key voucher (no signature required per call)
export async function decryptWithVoucher({
  keypair,
  voucher,
  publicClient: client,
  handles,
}: {
  keypair: SessionKeypair;
  voucher: unknown;
  publicClient: PublicClient;
  handles: HexString[];
}): Promise<bigint[]> {
  if (handles.length === 0) {
    return [];
  }

  // Filter out zero handles
  const validHandles = handles.filter(h => h !== ZERO_HANDLE);
  if (validHandles.length === 0) {
    return handles.map(() => 0n);
  }

  console.log("[DecryptVoucher] Decrypting", validHandles.length, "handles with session key...");

  const inco = await getConfig();

  const backoffConfig = {
    maxRetries: 10,
    initialDelay: 3000,
    maxDelay: 30000
  };

  try {
    // Use type assertion for the voucher decrypt API
    const incoWithVoucher = inco as unknown as {
      attestedDecryptWithVoucher: (
        keypair: SessionKeypair,
        voucher: unknown,
        publicClient: PublicClient,
        handles: HexString[],
        reencryptPubKey?: unknown,
        backoffConfig?: { maxRetries: number; initialDelay: number; maxDelay: number }
      ) => Promise<Array<{ plaintext: { value: bigint } }>>;
    };

    const results = await incoWithVoucher.attestedDecryptWithVoucher(
      keypair,
      voucher,
      client,
      validHandles,
      undefined, // no reencrypt
      backoffConfig
    );

    // Map results back to original handle order (including zero handles)
    let resultIndex = 0;
    const values = handles.map(h => {
      if (h === ZERO_HANDLE) {
        return 0n;
      }
      return results[resultIndex++].plaintext.value;
    });

    console.log("[DecryptVoucher] Successfully decrypted", values.length, "values");
    return values;
  } catch (error) {
    console.error("[DecryptVoucher] Failed:", error);
    throw error;
  }
}
