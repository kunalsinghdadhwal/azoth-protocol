"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useRouter } from "next/navigation";
import {
  AZOTH_DAO_ADDRESS,
  AZOTH_DAO_ABI,
  CGOV_TOKEN_ADDRESS,
  CGOV_TOKEN_ABI,
  ProposalState,
  VoteType,
  VotingMode,
} from "@/utils/constants";
import { encryptValue, getFee, decryptValue } from "@/utils/inco";
import { formatEther, parseUnits, formatUnits } from "viem";

interface Proposal {
  id: number;
  proposer: string;
  description: string;
  recipient: string;
  startBlock: bigint;
  endBlock: bigint;
  state: ProposalState;
  votingMode: VotingMode;
  executed: boolean;
}

interface VoteResults {
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
}

const Proposals = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const router = useRouter();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<bigint>(0n);

  const [isMember, setIsMember] = useState(false);
  const [hasVotingPower, setHasVotingPower] = useState(false);

  const [description, setDescription] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [votingMode, setVotingMode] = useState<VotingMode>(VotingMode.Normal);
  const [isCreating, setIsCreating] = useState(false);
  const [fee, setFee] = useState<bigint>(0n);

  const [votingProposal, setVotingProposal] = useState<number | null>(null);
  
  // Vote reveal state
  const [revealingVotes, setRevealingVotes] = useState<number | null>(null);
  const [voteResults, setVoteResults] = useState<Record<number, VoteResults>>({});
  const [finalizingProposal, setFinalizingProposal] = useState<number | null>(null);

  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!publicClient) return;

      setIsLoading(true);
      console.log("[Proposals] Fetching data...");
      
      try {
        const block = await publicClient.getBlockNumber();
        console.log("[Proposals] Current block:", block.toString());
        setCurrentBlock(block);

        console.log("[Proposals] Getting Inco fee...");
        const incoFee = await getFee();
        console.log("[Proposals] Fee:", formatEther(incoFee), "ETH");
        setFee(incoFee);

        if (address) {
          console.log("[Proposals] Checking eligibility for:", address);
          
          const memberStatus = await publicClient.readContract({
            address: AZOTH_DAO_ADDRESS,
            abi: AZOTH_DAO_ABI,
            functionName: "isMember",
            args: [address],
          }) as boolean;
          console.log("[Proposals] isMember:", memberStatus);
          setIsMember(memberStatus);

          const votingStatus = await publicClient.readContract({
            address: CGOV_TOKEN_ADDRESS,
            abi: CGOV_TOKEN_ABI,
            functionName: "hasVotingPower",
            args: [address],
          }) as boolean;
          console.log("[Proposals] hasVotingPower:", votingStatus);
          setHasVotingPower(votingStatus);
        }

        const count = (await publicClient.readContract({
          address: AZOTH_DAO_ADDRESS,
          abi: AZOTH_DAO_ABI,
          functionName: "proposalCount",
        })) as bigint;
        console.log("[Proposals] Proposal count:", count.toString());

        const proposalList: Proposal[] = [];
        for (let i = 1; i <= Number(count); i++) {
          const proposal = (await publicClient.readContract({
            address: AZOTH_DAO_ADDRESS,
            abi: AZOTH_DAO_ABI,
            functionName: "getProposal",
            args: [BigInt(i)],
          })) as [string, string, string, bigint, bigint, number, number, boolean];

          proposalList.push({
            id: i,
            proposer: proposal[0],
            description: proposal[1],
            recipient: proposal[2],
            startBlock: proposal[3],
            endBlock: proposal[4],
            state: proposal[5] as ProposalState,
            votingMode: proposal[6] as VotingMode,
            executed: proposal[7],
          });
        }

        setProposals(proposalList.reverse());
      } catch (err) {
        console.error("[Proposals] Failed to fetch data:", err);
        setError("Failed to load proposals. Check console for details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [publicClient, address, txHash]);

  const handleCreateProposal = async () => {
    if (!walletClient || !address || !description || !recipient || !amount) {
      console.log("[Proposals] Missing fields for proposal creation");
      return;
    }

    setIsCreating(true);
    setError(null);
    setTxHash(null);

    console.log("[Proposals] Creating proposal...");
    console.log("[Proposals] Description:", description);
    console.log("[Proposals] Recipient:", recipient);
    console.log("[Proposals] Amount (cUSDC):", amount);
    console.log("[Proposals] Voting Mode:", votingMode === VotingMode.Normal ? "Normal" : "Quadratic");
    console.log("[Proposals] Required fee:", formatEther(fee), "ETH");

    try {
      const amountBigInt = parseUnits(amount, 6);
      console.log("[Proposals] Amount in wei:", amountBigInt.toString());
      
      console.log("[Proposals] Encrypting amount...");
      const encryptedAmount = await encryptValue({
        value: amountBigInt,
        address,
        contractAddress: AZOTH_DAO_ADDRESS,
      });
      console.log("[Proposals] Encrypted amount:", encryptedAmount);

      console.log("[Proposals] Sending transaction...");
      const hash = await walletClient.writeContract({
        address: AZOTH_DAO_ADDRESS,
        abi: AZOTH_DAO_ABI,
        functionName: "propose",
        args: [description, encryptedAmount, recipient as `0x${string}`, votingMode],
        value: fee,
      });

      console.log("[Proposals] Transaction submitted:", hash);
      setTxHash(hash);
      setShowCreateForm(false);
      setDescription("");
      setRecipient("");
      setAmount("");

      if (publicClient) {
        console.log("[Proposals] Waiting for confirmation...");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log("[Proposals] Confirmed in block:", receipt.blockNumber);
      }
    } catch (err: unknown) {
      console.error("[Proposals] Create proposal failed:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage.slice(0, 200));
    } finally {
      setIsCreating(false);
    }
  };

  const handleVote = async (proposalId: number, support: VoteType) => {
    if (!walletClient || !address) return;

    setVotingProposal(proposalId);
    setError(null);
    setTxHash(null);

    try {
      const hash = await walletClient.writeContract({
        address: AZOTH_DAO_ADDRESS,
        abi: AZOTH_DAO_ABI,
        functionName: "castVote",
        args: [BigInt(proposalId), support],
      });

      setTxHash(hash);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
    } catch (err: unknown) {
      console.error("Vote failed:", err);
      setError(err instanceof Error ? err.message : "Failed to cast vote");
    } finally {
      setVotingProposal(null);
    }
  };

  const handleQueueProposal = async (proposalId: number) => {
    if (!walletClient || !address) return;

    setError(null);
    setTxHash(null);

    try {
      const hash = await walletClient.writeContract({
        address: AZOTH_DAO_ADDRESS,
        abi: AZOTH_DAO_ABI,
        functionName: "queueProposal",
        args: [BigInt(proposalId)],
      });

      setTxHash(hash);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
    } catch (err: unknown) {
      console.error("Queue failed:", err);
      setError(err instanceof Error ? err.message : "Failed to queue proposal");
    }
  };

  const handleExecuteProposal = async (proposalId: number) => {
    if (!walletClient || !address) return;

    setError(null);
    setTxHash(null);

    try {
      const hash = await walletClient.writeContract({
        address: AZOTH_DAO_ADDRESS,
        abi: AZOTH_DAO_ABI,
        functionName: "executeProposal",
        args: [BigInt(proposalId)],
      });

      setTxHash(hash);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
    } catch (err: unknown) {
      console.error("Execute failed:", err);
      setError(err instanceof Error ? err.message : "Failed to execute proposal");
    }
  };

  // Finalize proposal - determines if it passed or failed based on decrypted votes
  const handleFinalizeProposal = async (proposalId: number) => {
    if (!walletClient || !address) return;

    const results = voteResults[proposalId];
    if (!results) {
      setError("Please reveal votes first before finalizing");
      return;
    }

    setFinalizingProposal(proposalId);
    setError(null);
    setTxHash(null);

    try {
      // Convert vote results to wei (they're already in human-readable format)
      const forVotesWei = parseUnits(results.forVotes, 18);
      const againstVotesWei = parseUnits(results.againstVotes, 18);

      console.log("[Proposals] Finalizing with votes:", {
        forVotes: results.forVotes,
        againstVotes: results.againstVotes,
        forVotesWei: forVotesWei.toString(),
        againstVotesWei: againstVotesWei.toString(),
      });

      const hash = await walletClient.writeContract({
        address: AZOTH_DAO_ADDRESS,
        abi: AZOTH_DAO_ABI,
        functionName: "finalizeProposal",
        args: [BigInt(proposalId), forVotesWei, againstVotesWei],
      });

      setTxHash(hash);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        // Reload proposals to get updated state
        const block = await publicClient.getBlockNumber();
        setCurrentBlock(block);
      }
    } catch (err: unknown) {
      console.error("Finalize failed:", err);
      setError(err instanceof Error ? err.message : "Failed to finalize proposal");
    } finally {
      setFinalizingProposal(null);
    }
  };

  // Reveal vote results (only works after voting ends)
  const handleRevealVotes = async (proposalId: number) => {
    if (!walletClient || !publicClient || !address) return;

    setRevealingVotes(proposalId);
    setError(null);

    try {
      console.log("[Proposals] Requesting vote reveal for proposal", proposalId);
      
      // Step 1: Call revealVotes to get ACL access
      const hash = await walletClient.writeContract({
        address: AZOTH_DAO_ADDRESS,
        abi: AZOTH_DAO_ABI,
        functionName: "revealVotes",
        args: [BigInt(proposalId)],
      });

      console.log("[Proposals] Waiting for ACL grant...", hash);
      await publicClient.waitForTransactionReceipt({ hash });

      // Step 2: Get vote handles
      const votes = await publicClient.readContract({
        address: AZOTH_DAO_ADDRESS,
        abi: AZOTH_DAO_ABI,
        functionName: "getVotes",
        args: [BigInt(proposalId)],
      }) as [`0x${string}`, `0x${string}`, `0x${string}`];

      console.log("[Proposals] Vote handles:", votes);

      // Step 3: Decrypt each vote tally
      const [forHandle, againstHandle, abstainHandle] = votes;
      
      let forVotes = "0";
      let againstVotes = "0";
      let abstainVotes = "0";

      if (forHandle !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        const decrypted = await decryptValue({
          walletClient,
          handle: forHandle,
          contractAddress: AZOTH_DAO_ADDRESS,
        });
        forVotes = formatUnits(decrypted, 18);
      }

      if (againstHandle !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        const decrypted = await decryptValue({
          walletClient,
          handle: againstHandle,
          contractAddress: AZOTH_DAO_ADDRESS,
        });
        againstVotes = formatUnits(decrypted, 18);
      }

      if (abstainHandle !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        const decrypted = await decryptValue({
          walletClient,
          handle: abstainHandle,
          contractAddress: AZOTH_DAO_ADDRESS,
        });
        abstainVotes = formatUnits(decrypted, 18);
      }

      console.log("[Proposals] Vote results:", { forVotes, againstVotes, abstainVotes });
      
      setVoteResults(prev => ({
        ...prev,
        [proposalId]: { forVotes, againstVotes, abstainVotes }
      }));

    } catch (err: unknown) {
      console.error("Reveal votes failed:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("VotingNotEnded")) {
        setError("Cannot reveal votes: Voting has not ended yet");
      } else if (errorMessage.includes("acl disallowed")) {
        setError("ACL Error: Please try again in a few seconds");
      } else {
        setError(errorMessage.slice(0, 200));
      }
    } finally {
      setRevealingVotes(null);
    }
  };

  // Check if votes can be revealed (voting ended AND user is member)
  const canRevealVotes = (proposal: Proposal): boolean => {
    return currentBlock > proposal.endBlock && !proposal.executed && isMember;
  };

  const getStateLabel = (proposal: Proposal): { text: string; color: string } => {
    if (proposal.executed) {
      return { text: "Executed", color: "bg-green-900/30 text-green-400 border-green-700/30" };
    }
    if (proposal.state === ProposalState.Canceled) {
      return { text: "Canceled", color: "bg-gray-800 text-gray-400 border-gray-700" };
    }
    if (proposal.state === ProposalState.Defeated) {
      return { text: "Defeated", color: "bg-red-900/30 text-red-400 border-red-700/30" };
    }
    if (proposal.state === ProposalState.Succeeded) {
      return { text: "Succeeded", color: "bg-green-900/30 text-green-400 border-green-700/30" };
    }
    if (proposal.state === ProposalState.Queued) {
      return { text: "Queued", color: "bg-yellow-900/30 text-yellow-400 border-yellow-700/30" };
    }
    if (currentBlock < proposal.startBlock) {
      return { text: "Pending", color: "bg-gray-800 text-gray-400 border-gray-700" };
    }
    if (currentBlock <= proposal.endBlock) {
      return { text: "Active", color: "bg-blue-900/30 text-blue-400 border-blue-700/30" };
    }
    return { text: "Voting Ended", color: "bg-purple-900/30 text-purple-400 border-purple-700/30" };
  };

  const canVote = (proposal: Proposal): boolean => {
    return (
      currentBlock >= proposal.startBlock &&
      currentBlock <= proposal.endBlock &&
      proposal.state !== ProposalState.Canceled &&
      !proposal.executed &&
      isMember &&
      hasVotingPower
    );
  };

  // Check if proposal can be finalized (voting ended, has vote results, state is Active/Pending)
  const canFinalize = (proposal: Proposal): boolean => {
    const results = voteResults[proposal.id];
    return (
      currentBlock > proposal.endBlock &&
      (proposal.state === ProposalState.Active || proposal.state === ProposalState.Pending) &&
      !proposal.executed &&
      isMember &&
      results !== undefined
    );
  };

  const canQueue = (proposal: Proposal): boolean => {
    // Can only queue if proposal state is Succeeded
    return (
      proposal.state === ProposalState.Succeeded &&
      !proposal.executed &&
      isMember
    );
  };

  const canExecute = (proposal: Proposal): boolean => {
    return proposal.state === ProposalState.Queued && !proposal.executed && isMember;
  };

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-100">Proposals</h2>
          <p className="text-sm text-gray-500">Create and vote on DAO proposals</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={!isMember || !hasVotingPower}
          className="btn-primary"
        >
          {showCreateForm ? "Cancel" : "+ New Proposal"}
        </button>
      </div>

      {/* Eligibility Warning */}
      {(!isMember || !hasVotingPower) && (
        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4">
          <h4 className="font-semibold text-yellow-400 mb-2">Not Eligible to Create Proposals</h4>
          <ul className="text-sm text-yellow-300 space-y-1">
            {!isMember && <li>• You must be a DAO member (go to Membership tab and Join)</li>}
            {!hasVotingPower && <li>• You must have cGOV tokens (go to cGOV tab and Mint)</li>}
          </ul>
        </div>
      )}

      {/* Create Proposal Form */}
      {showCreateForm && isMember && hasVotingPower && (
        <div className="bg-[#1a1a2e] rounded-xl p-4 space-y-4 border border-gray-800">
          <h3 className="font-semibold text-gray-100">Create New Proposal</h3>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your proposal..."
              className="input-field"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Requested cUSDC Amount (Encrypted)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Voting Mode
            </label>
            <select
              value={votingMode}
              onChange={(e) => setVotingMode(Number(e.target.value) as VotingMode)}
              className="input-field"
            >
              <option value={VotingMode.Normal}>Normal (Linear)</option>
              <option value={VotingMode.Quadratic}>Quadratic</option>
            </select>
          </div>

          <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-3">
            <p className="text-sm text-amber-300">
              Fee: {formatEther(fee)} ETH (for encryption)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (description) params.set("title", description.slice(0, 100));
                if (description) params.set("description", description);
                router.push(`/agent?${params.toString()}`);
              }}
              disabled={!description}
              className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21" />
              </svg>
              Ask AI for Suggestions
            </button>
            <button
              onClick={handleCreateProposal}
              disabled={isCreating || !description || !recipient || !amount}
              className="flex-1 btn-primary py-3"
            >
              {isCreating ? "Creating..." : "Create Proposal"}
            </button>
          </div>
        </div>
      )}

      {/* Proposals List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading proposals...</div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No proposals yet. Create the first one!
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const stateLabel = getStateLabel(proposal);
            return (
              <div
                key={proposal.id}
                className="border border-gray-800 rounded-xl p-4 space-y-3 bg-[#1a1a2e]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-gray-500">
                        #{proposal.id}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${stateLabel.color}`}
                      >
                        {stateLabel.text}
                      </span>
                      <span className="text-xs text-gray-500">
                        {proposal.votingMode === VotingMode.Quadratic
                          ? "Quadratic"
                          : "Normal"}
                      </span>
                    </div>
                    <p className="text-gray-200 mt-1">{proposal.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Recipient: {proposal.recipient.slice(0, 8)}...
                      {proposal.recipient.slice(-6)}
                    </p>
                    <p className="text-xs text-gray-600">
                      Blocks: {proposal.startBlock.toString()} -{" "}
                      {proposal.endBlock.toString()} (Current: {currentBlock.toString()})
                    </p>
                  </div>
                </div>

                {/* Voting Buttons */}
                {canVote(proposal) && (
                  <div className="space-y-2">
                    {/* Encrypted votes badge during voting */}
                    <div className="flex items-center space-x-2 text-purple-400 text-xs">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span>Votes are encrypted until voting ends</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleVote(proposal.id, VoteType.For)}
                        disabled={votingProposal === proposal.id}
                        className="flex-1 py-2 bg-green-900/30 text-green-400 rounded-lg text-sm font-medium hover:bg-green-900/50 border border-green-700/30 disabled:opacity-50"
                      >
                        For
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, VoteType.Against)}
                        disabled={votingProposal === proposal.id}
                        className="flex-1 py-2 bg-red-900/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-900/50 border border-red-700/30 disabled:opacity-50"
                      >
                        Against
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, VoteType.Abstain)}
                        disabled={votingProposal === proposal.id}
                        className="flex-1 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-700 border border-gray-700 disabled:opacity-50"
                      >
                        Abstain
                      </button>
                    </div>
                  </div>
                )}

                {/* Vote Results Section - shows after voting ends */}
                {canRevealVotes(proposal) && (
                  <div className="space-y-2">
                    {voteResults[proposal.id] ? (
                      <div className="bg-[#252540] rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-400">For:</span>
                          <span className="font-semibold text-gray-100">{parseFloat(voteResults[proposal.id].forVotes).toFixed(2)} cGOV</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-red-400">Against:</span>
                          <span className="font-semibold text-gray-100">{parseFloat(voteResults[proposal.id].againstVotes).toFixed(2)} cGOV</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Abstain:</span>
                          <span className="font-semibold text-gray-100">{parseFloat(voteResults[proposal.id].abstainVotes).toFixed(2)} cGOV</span>
                        </div>
                        <div className="pt-2 border-t border-gray-700">
                          <div className="text-xs text-gray-500">
                            Result: {parseFloat(voteResults[proposal.id].forVotes) > parseFloat(voteResults[proposal.id].againstVotes) 
                              ? <span className="text-green-400">Passed</span> 
                              : <span className="text-red-400">Rejected</span>}
                          </div>
                        </div>
                        {/* Finalize Button - only shows when votes revealed and proposal not yet finalized */}
                        {canFinalize(proposal) && (
                          <button
                            onClick={() => handleFinalizeProposal(proposal.id)}
                            disabled={finalizingProposal === proposal.id}
                            className="w-full mt-2 py-2 bg-indigo-900/30 text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-900/50 border border-indigo-700/30"
                          >
                            {finalizingProposal === proposal.id ? "Finalizing..." : "Finalize Proposal Outcome"}
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRevealVotes(proposal.id)}
                        disabled={revealingVotes === proposal.id}
                        className="w-full py-2 bg-purple-900/30 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-900/50 border border-purple-700/30 flex items-center justify-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        <span>{revealingVotes === proposal.id ? "Decrypting..." : "Reveal Vote Results"}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Queue Button */}
                {canQueue(proposal) && (
                  <button
                    onClick={() => handleQueueProposal(proposal.id)}
                    className="w-full py-2 bg-yellow-900/30 text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-900/50 border border-yellow-700/30"
                  >
                    Queue for Execution
                  </button>
                )}

                {/* Execute Button */}
                {canExecute(proposal) && (
                  <button
                    onClick={() => handleExecuteProposal(proposal.id)}
                    className="w-full py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                  >
                    Execute Proposal
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

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

export default Proposals;
