"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { formatUnits } from "viem";
import {
  CONFIDENTIAL_VAULT_ADDRESS,
  CONFIDENTIAL_VAULT_ABI,
  CUSDC_MARKETPLACE_ADDRESS,
  CUSDC_MARKETPLACE_ABI,
} from "@/utils/constants";
import { decryptValue } from "@/utils/inco";

const ConfidentialVault = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [shares, setShares] = useState<string | null>(null);
  const [cUSDCBalance, setCUSDCBalance] = useState<string | null>(null);
  const [hasSharesOnChain, setHasSharesOnChain] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkShares = async () => {
      if (!publicClient || !address) return;
      try {
        const hasShares = await publicClient.readContract({
          address: CONFIDENTIAL_VAULT_ADDRESS,
          abi: CONFIDENTIAL_VAULT_ABI,
          functionName: "hasShares",
          args: [address],
        }) as boolean;
        setHasSharesOnChain(hasShares);
      } catch (err) {
        console.error("Failed to check shares:", err);
      }
    };
    checkShares();
  }, [publicClient, address]);

  const handleGetBalances = async () => {
    if (!publicClient || !walletClient || !address) {
      console.log("[Vault] Missing dependencies for balance check");
      return;
    }

    setIsDecrypting(true);
    setError(null);
    
    console.log("[Vault] Fetching balances for:", address);

    try {
      try {
        const cUSDCAllowed = await publicClient.readContract({
          address: CUSDC_MARKETPLACE_ADDRESS,
          abi: CUSDC_MARKETPLACE_ABI,
          functionName: "checkBalanceACL",
          args: [address],
        }) as boolean;
        console.log("[Vault] cUSDC ACL check:", cUSDCAllowed);
      } catch (e) {
        console.log("[Vault] cUSDC ACL check not available");
      }

      try {
        const sharesAllowed = await publicClient.readContract({
          address: CONFIDENTIAL_VAULT_ADDRESS,
          abi: CONFIDENTIAL_VAULT_ABI,
          functionName: "checkSharesACL",
          args: [address],
        }) as boolean;
        console.log("[Vault] Shares ACL check:", sharesAllowed);
      } catch (e) {
        console.log("[Vault] Shares ACL check not available");
      }

      console.log("[Vault] Getting cUSDC handle...");
      const cUSDCHandle = (await publicClient.readContract({
        address: CUSDC_MARKETPLACE_ADDRESS,
        abi: CUSDC_MARKETPLACE_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as `0x${string}`;

      if (cUSDCHandle !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        const decryptedCUSDC = await decryptValue({
          walletClient,
          handle: cUSDCHandle,
          contractAddress: CUSDC_MARKETPLACE_ADDRESS,
        });
        console.log("[Vault] cUSDC balance:", formatUnits(decryptedCUSDC, 6));
        setCUSDCBalance(formatUnits(decryptedCUSDC, 6));
      } else {
        setCUSDCBalance("0");
      }

      console.log("[Vault] Getting shares handle...");
      const sharesHandle = (await publicClient.readContract({
        address: CONFIDENTIAL_VAULT_ADDRESS,
        abi: CONFIDENTIAL_VAULT_ABI,
        functionName: "shares",
        args: [address],
      })) as `0x${string}`;

      if (sharesHandle !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        const decryptedShares = await decryptValue({
          walletClient,
          handle: sharesHandle,
          contractAddress: CONFIDENTIAL_VAULT_ADDRESS,
        });
        console.log("[Vault] Shares balance:", formatUnits(decryptedShares, 18));
        setShares(formatUnits(decryptedShares, 18));
      } else {
        setShares("0");
      }
    } catch (err: unknown) {
      console.error("[Vault] Failed to get balances:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("acl disallowed")) {
        setError("ACL Error: Inco hasn't processed the ACL yet. Wait a few seconds and try again.");
      } else {
        setError(`Failed to decrypt balances: ${errorMessage.slice(0, 100)}`);
      }
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleDepositAll = async () => {
    if (!publicClient || !walletClient || !address) return;

    setIsDepositing(true);
    setError(null);
    setTxHash(null);

    try {
      // Check if user has cUSDC balance before depositing
      const cUSDCHandle = (await publicClient.readContract({
        address: CUSDC_MARKETPLACE_ADDRESS,
        abi: CUSDC_MARKETPLACE_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as `0x${string}`;

      if (cUSDCHandle === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        setError("No cUSDC balance to deposit");
        return;
      }

      // Deposit now takes no arguments - it uses stored balance in marketplace
      const hash = await walletClient.writeContract({
        address: CONFIDENTIAL_VAULT_ADDRESS,
        abi: CONFIDENTIAL_VAULT_ABI,
        functionName: "deposit",
        args: [],
      });

      setTxHash(hash);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        setHasSharesOnChain(true);
      }
    } catch (err: unknown) {
      console.error("Deposit failed:", err);
      setError(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdrawAll = async () => {
    if (!publicClient || !walletClient || !address) return;

    setIsWithdrawing(true);
    setError(null);
    setTxHash(null);

    try {
      const hasShares = await publicClient.readContract({
        address: CONFIDENTIAL_VAULT_ADDRESS,
        abi: CONFIDENTIAL_VAULT_ABI,
        functionName: "hasShares",
        args: [address],
      }) as boolean;

      if (!hasShares) {
        setError("No shares to withdraw. Make sure you deposited to this vault.");
        return;
      }

      console.log("[Vault] Calling withdrawAll...");
      const hash = await walletClient.writeContract({
        address: CONFIDENTIAL_VAULT_ADDRESS,
        abi: CONFIDENTIAL_VAULT_ABI,
        functionName: "withdrawAll",
        args: [],
      });

      console.log("[Vault] Withdraw tx:", hash);
      setTxHash(hash);

      if (publicClient) {
        console.log("[Vault] Waiting for confirmation...");
        await publicClient.waitForTransactionReceipt({ hash });
        console.log("[Vault] Withdraw confirmed!");
        setHasSharesOnChain(false);
      }
    } catch (err: unknown) {
      console.error("[Vault] Withdraw failed:", err);
      setError(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-100">Confidential Vault</h2>
          <p className="text-sm text-gray-500">ERC-4626 vault with inflation protection</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            hasSharesOnChain
              ? "bg-green-900/30 text-green-400 border border-green-700/30"
              : "bg-gray-800 text-gray-400 border border-gray-700"
          }`}
        >
          {hasSharesOnChain ? "Has Shares" : "No Shares"}
        </span>
      </div>

      {/* Balances Display */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1a1a2e] rounded-xl p-4 border border-blue-900/30">
          <p className="text-sm text-gray-400">cUSDC Balance</p>
          <p className="text-xl font-bold text-gray-100">
            {cUSDCBalance !== null ? (
              cUSDCBalance
            ) : (
              <span className="text-purple-400 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </p>
        </div>
        <div className="bg-[#1a1a2e] rounded-xl p-4 border border-green-900/30">
          <p className="text-sm text-gray-400">Vault Shares</p>
          <p className="text-xl font-bold text-gray-100">
            {shares !== null ? (
              shares
            ) : (
              <span className="text-purple-400 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </p>
        </div>
      </div>

      <button
        onClick={handleGetBalances}
        disabled={isDecrypting || !address}
        className="w-full py-3 bg-[#1a1a2e] text-gray-300 rounded-xl font-medium hover:bg-[#252540] border border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isDecrypting ? "Decrypting..." : "Reveal All Balances"}
      </button>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleDepositAll}
          disabled={isDepositing || !address}
          className="py-4 bg-gradient-to-r from-green-700 to-emerald-700 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isDepositing ? "Depositing..." : "Deposit All cUSDC"}
        </button>

        <button
          onClick={handleWithdrawAll}
          disabled={isWithdrawing || !address}
          className="py-4 bg-gradient-to-r from-red-700 to-orange-700 text-white rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isWithdrawing ? "Withdrawing..." : "Ragequit"}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
        <p className="text-sm text-blue-300">
          <strong>Ragequit:</strong> You can withdraw your proportional share of
          the vault at any time, including during proposal queue periods.
        </p>
      </div>

      {/* Success/Error Messages */}
      {txHash && (
        <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4">
          <p className="text-sm font-medium text-green-400">Transaction Successful!</p>
          <a
            href={`https://sepolia.basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-500 hover:text-green-400"
          >
            View on Explorer →
          </a>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ConfidentialVault;
