"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import {
  AZOTH_DAO_ADDRESS,
  AZOTH_DAO_ABI,
  CONFIDENTIAL_VAULT_ADDRESS,
  CONFIDENTIAL_VAULT_ABI,
  CGOV_TOKEN_ADDRESS,
  CGOV_TOKEN_ABI,
} from "@/utils/constants";

const DAOMembership = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [isMember, setIsMember] = useState(false);
  const [hasVaultShares, setHasVaultShares] = useState(false);
  const [hasVotingPower, setHasVotingPower] = useState(false);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembershipData = async () => {
      if (!publicClient || !address) return;
      
      setIsLoading(true);
      console.log("[DAOMembership] Fetching data for:", address);
      
      try {
        const memberStatus = await publicClient.readContract({
          address: AZOTH_DAO_ADDRESS,
          abi: AZOTH_DAO_ABI,
          functionName: "isMember",
          args: [address],
        }) as boolean;
        console.log("[DAOMembership] isMember:", memberStatus);
        setIsMember(memberStatus);

        const sharesStatus = await publicClient.readContract({
          address: CONFIDENTIAL_VAULT_ADDRESS,
          abi: CONFIDENTIAL_VAULT_ABI,
          functionName: "hasShares",
          args: [address],
        }) as boolean;
        console.log("[DAOMembership] hasVaultShares:", sharesStatus);
        setHasVaultShares(sharesStatus);

        const votingStatus = await publicClient.readContract({
          address: CGOV_TOKEN_ADDRESS,
          abi: CGOV_TOKEN_ABI,
          functionName: "hasVotingPower",
          args: [address],
        }) as boolean;
        console.log("[DAOMembership] hasVotingPower:", votingStatus);
        setHasVotingPower(votingStatus);

        const count = await publicClient.readContract({
          address: AZOTH_DAO_ADDRESS,
          abi: AZOTH_DAO_ABI,
          functionName: "memberCount",
        }) as bigint;
        console.log("[DAOMembership] memberCount:", count.toString());
        setMemberCount(Number(count));
      } catch (err) {
        console.error("[DAOMembership] Failed to fetch membership data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMembershipData();
  }, [publicClient, address, txHash]);

  const handleJoinDAO = async () => {
    if (!walletClient || !address) return;
    
    setIsJoining(true);
    setError(null);
    setTxHash(null);
    
    try {
      const hash = await walletClient.writeContract({
        address: AZOTH_DAO_ADDRESS,
        abi: AZOTH_DAO_ABI,
        functionName: "joinDAO",
      });
      
      setTxHash(hash);
      
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        setIsMember(true);
      }
    } catch (err: unknown) {
      console.error("Join failed:", err);
      setError(err instanceof Error ? err.message : "Failed to join DAO");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveDAO = async () => {
    if (!walletClient || !address) return;
    
    setIsLeaving(true);
    setError(null);
    setTxHash(null);
    
    try {
      const hash = await walletClient.writeContract({
        address: AZOTH_DAO_ADDRESS,
        abi: AZOTH_DAO_ABI,
        functionName: "leaveDAO",
      });
      
      setTxHash(hash);
      
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        setIsMember(false);
      }
    } catch (err: unknown) {
      console.error("Leave failed:", err);
      setError(err instanceof Error ? err.message : "Failed to leave DAO");
    } finally {
      setIsLeaving(false);
    }
  };

  const StatusIcon = ({ active }: { active: boolean }) => (
    active ? (
      <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    )
  );

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-100">DAO Membership</h2>
          <p className="text-sm text-gray-500">Join or leave the Azoth DAO</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total Members</p>
          <p className="text-2xl font-bold text-purple-400">{memberCount}</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`rounded-xl p-4 text-center border ${
          isMember ? "bg-green-900/20 border-green-700/30" : "bg-[#1a1a2e] border-gray-800"
        }`}>
          <div className="flex justify-center mb-2"><StatusIcon active={isMember} /></div>
          <p className="text-sm font-medium text-gray-300">DAO Member</p>
        </div>
        <div className={`rounded-xl p-4 text-center border ${
          hasVaultShares ? "bg-green-900/20 border-green-700/30" : "bg-[#1a1a2e] border-gray-800"
        }`}>
          <div className="flex justify-center mb-2"><StatusIcon active={hasVaultShares} /></div>
          <p className="text-sm font-medium text-gray-300">Vault Shares</p>
        </div>
        <div className={`rounded-xl p-4 text-center border ${
          hasVotingPower ? "bg-green-900/20 border-green-700/30" : "bg-[#1a1a2e] border-gray-800"
        }`}>
          <div className="flex justify-center mb-2"><StatusIcon active={hasVotingPower} /></div>
          <p className="text-sm font-medium text-gray-300">Voting Power</p>
        </div>
      </div>

      {/* Requirements Info */}
      {!isMember && !hasVaultShares && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4">
          <p className="text-sm text-amber-300">
            <strong>Requirements to Join:</strong> You must have vault shares 
            (deposit cUSDC into the vault) before you can join the DAO.
          </p>
        </div>
      )}

      {isMember && !hasVotingPower && (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
          <p className="text-sm text-blue-300">
            <strong>Get Voting Power:</strong> Mint cGOV tokens to be able to 
            vote on proposals. Membership alone doesn&apos;t grant voting rights.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {isLoading ? (
        <div className="text-center py-4 text-gray-500">Loading...</div>
      ) : isMember ? (
        <button
          onClick={handleLeaveDAO}
          disabled={isLeaving}
          className="w-full py-4 bg-gradient-to-r from-red-700 to-orange-700 text-white rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLeaving ? "Leaving..." : "Leave DAO"}
        </button>
      ) : (
        <button
          onClick={handleJoinDAO}
          disabled={isJoining || !hasVaultShares}
          className="w-full py-4 bg-gradient-to-r from-green-700 to-emerald-700 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isJoining ? "Joining..." : "Join DAO"}
        </button>
      )}

      {/* Workflow Guide */}
      <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800">
        <p className="text-sm font-medium text-gray-300 mb-3">Complete Workflow:</p>
        <ol className="text-sm text-gray-400 space-y-2">
          <li className={`flex items-center space-x-2 ${hasVaultShares ? "text-green-400" : ""}`}>
            <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-xs">1</span>
            <span>Purchase cUSDC with ETH {hasVaultShares && <span className="text-green-500">✓</span>}</span>
          </li>
          <li className={`flex items-center space-x-2 ${hasVaultShares ? "text-green-400" : ""}`}>
            <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-xs">2</span>
            <span>Deposit cUSDC into Vault {hasVaultShares && <span className="text-green-500">✓</span>}</span>
          </li>
          <li className={`flex items-center space-x-2 ${isMember ? "text-green-400" : ""}`}>
            <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-xs">3</span>
            <span>Join DAO {isMember && <span className="text-green-500">✓</span>}</span>
          </li>
          <li className={`flex items-center space-x-2 ${hasVotingPower ? "text-green-400" : ""}`}>
            <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-xs">4</span>
            <span>Mint cGOV for voting power {hasVotingPower && <span className="text-green-500">✓</span>}</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-xs">5</span>
            <span>Create & vote on proposals</span>
          </li>
        </ol>
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

export default DAOMembership;
