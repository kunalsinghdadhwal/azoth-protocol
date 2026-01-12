"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/header";
import Padder from "@/components/padder";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { v4 as uuidv4 } from "uuid";
import { type Hex, toHex } from "viem";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface PaymentRequirement {
  scheme: string;
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: {
    name: string;
    version: string;
  };
}

interface X402PaymentInfo {
  x402Version: number;
  error: string;
  resource: {
    url: string;
    description: string;
    mimeType: string;
  };
  accepts: PaymentRequirement[];
}

// x402 Payment Configuration for Base Sepolia
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }]
  }
] as const;

const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || "http://localhost:3001";

// Toggle between free and paid endpoints
const USE_FREE_ENDPOINT = process.env.NEXT_PUBLIC_USE_FREE_ENDPOINT === "true";

export default function AgentChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [error, setError] = useState<string | null>(null);
  
  // x402 payment state
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<X402PaymentInfo | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("");

  // Get proposal context from URL params
  const proposalTitle = searchParams.get("title") || "";
  const proposalDescription = searchParams.get("description") || "";

  // Build proposal context string
  const proposalContext = proposalTitle || proposalDescription
    ? `Proposal Title: ${proposalTitle}\n\nProposal Description: ${proposalDescription}`
    : "";

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    const greeting: Message = {
      id: uuidv4(),
      role: "assistant",
      content: proposalContext
        ? `Hello! I'm the Azoth DAO AI Advisor. I see you want to discuss a proposal:\n\n**${proposalTitle}**\n\n${proposalDescription ? proposalDescription.substring(0, 200) + "..." : ""}\n\nI can help you analyze this proposal, identify potential risks, suggest improvements, or answer any governance questions. What would you like to know?`
        : "Hello! I'm the Azoth DAO AI Advisor. I can help you with:\n\n• Analyzing DAO proposals\n• Understanding governance mechanics\n• Risk assessment for voting decisions\n• Best practices for proposal creation\n\nHow can I assist you today?",
      timestamp: new Date(),
    };
    setMessages([greeting]);
  }, [proposalContext, proposalTitle, proposalDescription]);

  const sendMessage = useCallback(async (messageContent?: string, paymentHeader?: string) => {
    const content = messageContent || inputMessage.trim();
    if (!content || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: content,
      timestamp: new Date(),
    };

    if (!paymentHeader) {
      setMessages((prev) => [...prev, userMessage]);
      setInputMessage("");
    }

    setIsLoading(true);
    setError(null);
    setPaymentRequired(false);
    setPaymentStatus("");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (paymentHeader) headers["PAYMENT-SIGNATURE"] = paymentHeader;

      const endpoint = USE_FREE_ENDPOINT ? `${AGENT_API_URL}/api/chat/free` : `${AGENT_API_URL}/api/chat`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: content,
          prompt: content,
          sessionId,
          walletAddress: address || "anonymous",
          proposalContext: proposalContext || undefined,
          enableWebSearch: false,
        }),
      });

      // Handle x402 payment required response
      if (response.status === 402) {
        const paymentRequiredHeader = response.headers.get("payment-required") ||
          response.headers.get("Payment-Required") ||
          response.headers.get("x-payment-required");

        if (paymentRequiredHeader) {
          try {
            setPaymentInfo(JSON.parse(atob(paymentRequiredHeader)));
          } catch (e) {
            console.error("Failed to parse payment header:", e);
          }
        } else {
          // Fallback default payment info
          setPaymentInfo({
            x402Version: 2,
            error: "Payment required",
            resource: { url: `${AGENT_API_URL}/api/chat`, description: "DAO AI Query", mimeType: "application/json" },
            accepts: [{
              scheme: "exact",
              network: "eip155:84532",
              amount: "10000", // 0.01 USDC (6 decimals)
              asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
              payTo: process.env.NEXT_PUBLIC_PAYMENT_ADDRESS || "0xD202eAD5640e3b6FaF1e458649358c6Bca8e089c",
              maxTimeoutSeconds: 300,
              extra: { name: "USDC", version: "2" }
            }]
          });
        }
        setPendingMessage(content);
        setPaymentRequired(true);
        setError("Payment required to continue. Pay $0.01 USDC to send your query.");
        return;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setPendingMessage(null);
      setPaymentInfo(null);
    } catch (err) {
      setError((err as Error).message);
      const errorMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading, sessionId, address, proposalContext]);

  // x402 Payment Handler
  const handlePayment = async () => {
    if (!isConnected || !address || !pendingMessage || !walletClient || !publicClient || !paymentInfo) {
      setError("Please connect wallet and ensure requirements are met");
      return;
    }

    const paymentReq = paymentInfo.accepts[0];
    setIsLoading(true);
    setPaymentStatus("Processing payment...");

    try {
      const amount = BigInt(paymentReq.amount);
      const payTo = paymentReq.payTo as Hex;
      const asset = paymentReq.asset as Hex;

      // Check USDC balance
      const balance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address]
      }) as bigint;

      if (balance < amount) throw new Error("Insufficient USDC balance. Get testnet USDC from Base Sepolia faucet.");

      setPaymentStatus("Please sign in wallet...");
      const now = Math.floor(Date.now() / 1000);
      const validAfter = (now - 600).toString();
      const validBefore = (now + (paymentReq.maxTimeoutSeconds || 300)).toString();
      const nonceBytes = new Uint8Array(32);
      crypto.getRandomValues(nonceBytes);
      const nonce = toHex(nonceBytes);

      const tokenName = paymentReq.extra?.name || "USDC";
      const tokenVersion = paymentReq.extra?.version || "2";
      const chainId = parseInt(paymentReq.network.split(":")[1]);

      // Sign EIP-3009 TransferWithAuthorization
      const signature = await walletClient.signTypedData({
        domain: { name: tokenName, version: tokenVersion, chainId, verifyingContract: asset },
        types: {
          TransferWithAuthorization: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "validAfter", type: "uint256" },
            { name: "validBefore", type: "uint256" },
            { name: "nonce", type: "bytes32" },
          ],
        },
        primaryType: "TransferWithAuthorization",
        message: {
          from: address,
          to: payTo,
          value: amount,
          validAfter: BigInt(validAfter),
          validBefore: BigInt(validBefore),
          nonce: nonce as Hex,
        },
      });

      const paymentPayload = {
        x402Version: 2,
        payload: {
          authorization: {
            from: address, to: payTo, value: amount.toString(), validAfter, validBefore, nonce
          },
          signature
        },
        resource: paymentInfo.resource,
        accepted: paymentReq
      };

      setPaymentStatus("Sending paid request...");
      await sendMessage(pendingMessage, btoa(JSON.stringify(paymentPayload)));

    } catch (err) {
      console.error("Payment error:", err);
      setError((err as Error).message || "Payment failed / rejected");
      setIsLoading(false);
      setPaymentStatus("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      <Padder>
        <Header />
      </Padder>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4">
        {/* Chat Header */}
        <div className="flex items-center justify-between py-4 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <div>
                <h1 className="font-semibold text-gray-100">Azoth DAO AI Advisor</h1>
                <p className="text-xs text-gray-500">Powered by nilAI • Encrypted with nilDB</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded-full border border-green-700/30">
              Online
            </span>
            <span className="px-2 py-1 bg-purple-900/30 text-purple-400 text-xs rounded-full border border-purple-700/30">
              TEE Secured
            </span>
          </div>
        </div>

        {/* Proposal Context Banner */}
        {proposalContext && (
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Discussing: <span className="font-medium">{proposalTitle}</span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800/50 text-gray-200 border border-gray-700/50"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-2 ${message.role === "user" ? "text-purple-200" : "text-gray-500"}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800/50 rounded-2xl px-4 py-3 border border-gray-700/50">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                  <span className="text-xs text-gray-500">{paymentStatus || "Processing in TEE..."}</span>
                </div>
              </div>
            </div>
          )}

          {/* x402 Payment Required Prompt */}
          {paymentRequired && !isLoading && (
            <div className="flex justify-center">
              <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4 max-w-md w-full">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <h3 className="font-semibold text-amber-400">Payment Required</h3>
                </div>
                <p className="text-sm text-gray-300 mb-4">
                  This query requires a micropayment of <strong className="text-amber-300">$0.01 USDC</strong> on Base Sepolia via x402 protocol.
                </p>
                <div className="text-xs text-gray-400 space-y-1 mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>Encrypted in nilDB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Processed in TEE</span>
                  </div>
                </div>
                {!isConnected ? (
                  <p className="text-xs text-gray-500 text-center">Connect your wallet to pay</p>
                ) : (
                  <button
                    onClick={handlePayment}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors"
                  >
                    Pay $0.01 USDC
                  </button>
                )}
              </div>
            </div>
          )}

          {error && !paymentRequired && (
            <div className="flex justify-center">
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg px-4 py-2">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="py-4 border-t border-gray-800">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about the proposal..."
                rows={1}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none"
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Your conversation is encrypted and stored securely in nilDB</span>
            {!USE_FREE_ENDPOINT && <span className="text-amber-400">$0.01 USDC per query (x402)</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
