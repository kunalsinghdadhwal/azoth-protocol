"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseEther, formatEther, formatUnits } from "viem";
import { CGOV_TOKEN_ADDRESS, CGOV_TOKEN_ABI } from "@/utils/constants";
import { decryptValue } from "@/utils/inco";

const CGOVToken = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [ethAmount, setEthAmount] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [mintPrice, setMintPrice] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMintPrice = async () => {
      if (!publicClient) return;
      try {
        const price = await publicClient.readContract({
          address: CGOV_TOKEN_ADDRESS,
          abi: CGOV_TOKEN_ABI,
          functionName: "mintPrice",
        }) as bigint;
        setMintPrice(price);
      } catch (err) {
        console.error("Failed to fetch mint price:", err);
      }
    };
    fetchMintPrice();
  }, [publicClient]);

  const expectedCGOV = ethAmount && mintPrice 
    ? (parseFloat(ethAmount) / parseFloat(formatEther(mintPrice))).toFixed(2)
    : "0";

  const handleMint = async () => {
    if (!walletClient || !address || !ethAmount) {
      console.log("[CGOVToken] Missing dependencies for mint");
      return;
    }
    
    setIsMinting(true);
    setError(null);
    setTxHash(null);
    
    console.log("[CGOVToken] Starting mint...");
    console.log("[CGOVToken] ETH amount:", ethAmount);
    console.log("[CGOVToken] Expected cGOV:", expectedCGOV);
    
    try {
      const hash = await walletClient.writeContract({
        address: CGOV_TOKEN_ADDRESS,
        abi: CGOV_TOKEN_ABI,
        functionName: "mint",
        value: parseEther(ethAmount),
      });
      
      console.log("[CGOVToken] Transaction submitted:", hash);
      setTxHash(hash);
      setEthAmount("");
      
      if (publicClient) {
        console.log("[CGOVToken] Waiting for confirmation...");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log("[CGOVToken] Confirmed in block:", receipt.blockNumber);
      }
    } catch (err: unknown) {
      console.error("[CGOVToken] Mint failed:", err);
      setError(err instanceof Error ? err.message : "Minting failed");
    } finally {
      setIsMinting(false);
    }
  };

  const handleGetBalance = async () => {
    if (!publicClient || !walletClient || !address) {
      console.log("[CGOVToken] Missing dependencies for balance check");
      return;
    }
    
    setIsDecrypting(true);
    setError(null);
    
    console.log("[CGOVToken] Fetching balance for:", address);
    
    try {
      const handle = await publicClient.readContract({
        address: CGOV_TOKEN_ADDRESS,
        abi: CGOV_TOKEN_ABI,
        functionName: "balanceOf",
        args: [address],
      }) as `0x${string}`;
      
      console.log("[CGOVToken] Got handle:", handle);
      
      if (handle === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        setBalance("0");
        return;
      }
      
      const decrypted = await decryptValue({
        walletClient,
        handle,
        contractAddress: CGOV_TOKEN_ADDRESS,
      });
      
      const formattedBalance = formatUnits(decrypted, 18);
      console.log("[CGOVToken] Balance:", formattedBalance);
      setBalance(formattedBalance);
    } catch (err: unknown) {
      console.error("[CGOVToken] Failed to get balance:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("acl disallowed")) {
        setError("ACL Error: You don't have permission to decrypt. Have you minted cGOV tokens?");
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
          <h2 className="text-xl font-bold text-gray-100">cGOV Governance Token</h2>
          <p className="text-sm text-gray-500">Mint tokens for voting power</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Mint Price</p>
          <p className="font-semibold text-purple-400">
            {mintPrice ? `${formatEther(mintPrice)} ETH/token` : "Loading..."}
          </p>
        </div>
      </div>

      {/* Balance Display */}
      <div className="bg-[#1a1a2e] rounded-xl p-4 border border-purple-900/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Your cGOV Balance (Voting Power)</p>
            <p className="text-2xl font-bold text-gray-100">
              {balance !== null ? (
                <span>{balance} <span className="text-purple-400">cGOV</span></span>
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

      {/* Info Box */}
      <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4">
        <p className="text-sm text-amber-300">
          <strong>Non-transferable:</strong> cGOV tokens are soulbound to your address. 
          They grant voting power but have no economic value.
        </p>
      </div>

      {/* Mint Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            ETH Amount
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.0001"
              min="0"
              placeholder="0.001"
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
          <div className="bg-purple-900/20 border border-purple-700/30 rounded-xl p-4">
            <p className="text-sm text-purple-400">You will receive approximately:</p>
            <p className="text-xl font-bold text-purple-300">{expectedCGOV} cGOV</p>
          </div>
        )}

        <button
          onClick={handleMint}
          disabled={isMinting || !ethAmount || !address}
          className="btn-primary w-full py-4"
        >
          {isMinting ? "Minting..." : "Mint cGOV Tokens"}
        </button>
      </div>

      {/* Success/Error Messages */}
      {txHash && (
        <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4">
          <p className="text-sm font-medium text-green-400">Minting Successful!</p>
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

export default CGOVToken;
