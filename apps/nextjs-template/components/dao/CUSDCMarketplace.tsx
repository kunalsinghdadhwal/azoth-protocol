"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseEther, formatUnits } from "viem";
import { CUSDC_MARKETPLACE_ADDRESS, CUSDC_MARKETPLACE_ABI } from "@/utils/constants";
import { decryptValue } from "@/utils/inco";

const CUSDCMarketplace = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [ethAmount, setEthAmount] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const expectedCUSDC = ethAmount ? (parseFloat(ethAmount) * 2000).toFixed(2) : "0";

  const handlePurchase = async () => {
    if (!walletClient || !address || !ethAmount) {
      console.log("[CUSDCMarketplace] Missing dependencies for purchase");
      return;
    }
    
    setIsPurchasing(true);
    setError(null);
    setTxHash(null);
    
    console.log("[CUSDCMarketplace] Starting purchase...");
    console.log("[CUSDCMarketplace] ETH amount:", ethAmount);
    console.log("[CUSDCMarketplace] Expected cUSDC:", expectedCUSDC);
    
    try {
      const hash = await walletClient.writeContract({
        address: CUSDC_MARKETPLACE_ADDRESS,
        abi: CUSDC_MARKETPLACE_ABI,
        functionName: "purchaseCUSDC",
        value: parseEther(ethAmount),
      });
      
      console.log("[CUSDCMarketplace] Transaction submitted:", hash);
      setTxHash(hash);
      setEthAmount("");
      
      if (publicClient) {
        console.log("[CUSDCMarketplace] Waiting for confirmation...");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log("[CUSDCMarketplace] Confirmed in block:", receipt.blockNumber);
        
        console.log("[CUSDCMarketplace] Waiting 20s for Inco to process operations...");
        setError("Purchase confirmed! Waiting ~20s for Inco to process encrypted operations...");
        await new Promise(resolve => setTimeout(resolve, 20000));
        setError(null);
        console.log("[CUSDCMarketplace] Wait complete. You can now reveal your balance!");
      }
    } catch (err: unknown) {
      console.error("[CUSDCMarketplace] Purchase failed:", err);
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleGetBalance = async () => {
    if (!publicClient || !walletClient || !address) {
      console.log("[CUSDCMarketplace] Missing dependencies");
      return;
    }
    
    setIsDecrypting(true);
    setError(null);
    
    console.log("[CUSDCMarketplace] Fetching balance for:", address);
    
    try {
      try {
        const isAllowed = await publicClient.readContract({
          address: CUSDC_MARKETPLACE_ADDRESS,
          abi: CUSDC_MARKETPLACE_ABI,
          functionName: "checkBalanceACL",
          args: [address],
        }) as boolean;
        console.log("[CUSDCMarketplace] ACL check result:", isAllowed);
        
        if (!isAllowed) {
          setError("ACL not ready. Inco may still be processing your transaction. Please wait and try again.");
          return;
        }
      } catch (aclErr) {
        console.log("[CUSDCMarketplace] ACL check not available:", aclErr);
      }

      const handle = await publicClient.readContract({
        address: CUSDC_MARKETPLACE_ADDRESS,
        abi: CUSDC_MARKETPLACE_ABI,
        functionName: "balanceOf",
        args: [address],
      }) as `0x${string}`;
      
      console.log("[CUSDCMarketplace] Got handle:", handle);
      
      if (handle === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        setBalance("0");
        return;
      }
      
      const decrypted = await decryptValue({
        walletClient,
        handle,
        contractAddress: CUSDC_MARKETPLACE_ADDRESS,
      });
      
      const formattedBalance = formatUnits(decrypted, 6);
      console.log("[CUSDCMarketplace] Decrypted balance:", formattedBalance);
      setBalance(formattedBalance);
    } catch (err: unknown) {
      console.error("[CUSDCMarketplace] Failed to get balance:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("acl disallowed")) {
        setError("ACL Error: Inco hasn't finished processing. Please wait 30-60 seconds and try again.");
      } else {
        setError(`Failed to decrypt balance: ${errorMessage.slice(0, 100)}`);
      }
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-100">cUSDC Marketplace</h2>
          <p className="text-sm text-gray-500">Exchange ETH for Confidential USDC</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Exchange Rate</p>
          <p className="font-semibold text-green-400">1 ETH = 2,000 cUSDC</p>
        </div>
      </div>

      {/* Balance Display */}
      <div className="bg-[#1a1a2e] rounded-xl p-4 border border-purple-900/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Your cUSDC Balance</p>
            <p className="text-2xl font-bold text-gray-100">
              {balance !== null ? (
                <span>{balance} <span className="text-purple-400">cUSDC</span></span>
              ) : (
                <span className="text-purple-400 flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Encrypted</span>
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleGetBalance}
            disabled={isDecrypting || !address}
            className="btn-primary"
          >
            {isDecrypting ? "Decrypting..." : "Reveal"}
          </button>
        </div>
      </div>

      {/* Purchase Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            ETH Amount
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.001"
              min="0"
              placeholder="0.01"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              className="input-field pr-16"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              ETH
            </span>
          </div>
        </div>

        {ethAmount && (
          <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4">
            <p className="text-sm text-green-400">You will receive approximately:</p>
            <p className="text-xl font-bold text-green-300">{expectedCUSDC} cUSDC</p>
          </div>
        )}

        <button
          onClick={handlePurchase}
          disabled={isPurchasing || !ethAmount || !address}
          className="btn-primary w-full py-4"
        >
          {isPurchasing ? "Purchasing..." : "Purchase cUSDC"}
        </button>
      </div>

      {/* Success/Error Messages */}
      {txHash && (
        <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4">
          <p className="text-sm font-medium text-green-400">Purchase Successful!</p>
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

export default CUSDCMarketplace;
