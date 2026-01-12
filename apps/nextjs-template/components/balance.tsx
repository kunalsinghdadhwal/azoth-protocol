import { CERC_ABI, CERC_CONTRACT_ADDRESS } from "@/utils/constants";
import { decryptValue } from "@/utils/inco";
import React, { useState } from "react";
import { formatEther } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

const Balance = () => {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const [balance, setBalance] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const readBalanceHandle = async () => {
    if (!address) return;
    if (!publicClient) return;
    const balance = await publicClient.readContract({
      address: CERC_CONTRACT_ADDRESS,
      abi: CERC_ABI,
      functionName: "balanceOf",
      args: [address],
    });
    console.log("Balance handle: ", balance);
    return balance as `0x${string}`;
  };

  const checkACL = async () => {
    if (!address) return false;
    if (!publicClient) return false;
    try {
      const isAllowed = await publicClient.readContract({
        address: CERC_CONTRACT_ADDRESS,
        abi: CERC_ABI,
        functionName: "checkBalanceACL",
        args: [address],
      });
      console.log("ACL check result:", isAllowed);
      return isAllowed as boolean;
    } catch (e) {
      console.log("ACL check not available (contract may not have debug functions):", e);
      return true; // Assume allowed if function doesn't exist
    }
  };

  const getHandle = async () => {
    if (!address) return;
    if (!publicClient) return;
    try {
      const handle = await publicClient.readContract({
        address: CERC_CONTRACT_ADDRESS,
        abi: CERC_ABI,
        functionName: "getBalanceHandle",
        args: [address],
      });
      console.log("Direct handle from contract:", handle);
      return handle as `0x${string}`;
    } catch (e) {
      console.log("getBalanceHandle not available:", e);
      return undefined;
    }
  };

  const handleReadBalance = async () => {
    setIsLoading(true);
    setError(undefined);
    
    try {
      // First, check ACL status on-chain
      const aclOk = await checkACL();
      console.log("🔐 ACL Check:", aclOk ? "ALLOWED" : "NOT ALLOWED");
      
      if (!aclOk) {
        setError("ACL not granted - you may not have purchased any cUSDC yet, or the transaction is still processing.");
        setIsLoading(false);
        return;
      }

      // Get handle from contract directly (for debugging)
      const directHandle = await getHandle();
      console.log("🔍 Direct handle:", directHandle);

      // Get handle from balanceOf
      const balanceHandle = await readBalanceHandle();
      console.log("🔍 balanceOf handle:", balanceHandle);
      
      // Check if handles match
      if (directHandle && balanceHandle && directHandle !== balanceHandle) {
        console.warn("⚠️ Handle mismatch! Direct:", directHandle, "vs balanceOf:", balanceHandle);
      }
      
      // Check for zero handle
      if (!balanceHandle || balanceHandle === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        setBalance("0");
        setIsLoading(false);
        return;
      }

      const decryptedBalance = await decryptValue({
        walletClient: walletClient!,
        handle: balanceHandle!,
      });
      console.log("Decrypted balance: ", decryptedBalance);

      // cUSDC has 6 decimals, not 18
      const formattedBalance = (Number(decryptedBalance) / 1e6).toFixed(2);
      console.log("Formatted balance: ", formattedBalance);

      setBalance(formattedBalance);
    } catch (e) {
      console.error("Error reading balance:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      if (errorMessage.includes("acl disallowed")) {
        setError("ACL Error: Your wallet is not allowed to decrypt this balance. This may be a timing issue - try again in a few seconds.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">Balance:</span>
          <span className="ml-2 font-mono">{balance || "0"} cUSDC</span>
        </div>
        <button
          onClick={handleReadBalance}
          disabled={isLoading}
          className="bg-gray-600 text-white py-2 px-4 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>
      {error && (
        <div className="text-red-500 text-sm bg-red-100 p-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default Balance;
