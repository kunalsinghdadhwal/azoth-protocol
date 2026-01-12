"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import Padder from "@/components/padder";

export const dynamic = "force-dynamic";
import { useRouter, useSearchParams } from "next/navigation";

interface AgentInfo {
  name: string;
  description: string;
  capabilities: string[];
  pricing: {
    model: string;
    price: string;
    paymentMethod: string;
  };
  privacy: {
    inference: string;
    storage: string;
  };
  agentId: string;
}

const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || "http://localhost:3001";

export default function AgentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get proposal context from URL params
  const proposalTitle = searchParams.get("title") || "";
  const proposalDescription = searchParams.get("description") || "";

  useEffect(() => {
    async function fetchAgentInfo() {
      try {
        const response = await fetch(`${AGENT_API_URL}/agent`);
        if (!response.ok) throw new Error("Failed to fetch agent info");
        const data = await response.json();
        setAgentInfo(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchAgentInfo();
  }, []);

  const handleChatWithAgent = () => {
    const params = new URLSearchParams();
    if (proposalTitle) params.set("title", proposalTitle);
    if (proposalDescription) params.set("description", proposalDescription);
    router.push(`/agent/chat?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <Padder>
          <Header />
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        </Padder>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <Padder>
          <Header />
          <div className="max-w-2xl mx-auto py-20">
            <div className="card p-8 border-red-500/50 bg-red-900/10">
              <h2 className="text-xl font-bold text-red-400 mb-2">Connection Error</h2>
              <p className="text-gray-400">{error}</p>
              <p className="text-sm text-gray-500 mt-4">
                Make sure the AI Agent backend is running on {AGENT_API_URL}
              </p>
            </div>
          </div>
        </Padder>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Padder>
        <Header />

        <div className="max-w-4xl mx-auto py-8">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Proposals
          </button>

          {/* Agent Card */}
          <div className="card p-8 glow-purple">
            {/* Header */}
            <div className="flex items-start gap-6 mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/50">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-100 mb-2">{agentInfo?.name}</h1>
                <p className="text-gray-400">{agentInfo?.description}</p>
              </div>
            </div>

            {/* Capabilities */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Capabilities
              </h2>
              <div className="flex flex-wrap gap-2">
                {agentInfo?.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="px-3 py-1.5 bg-purple-900/30 text-purple-300 rounded-lg text-sm border border-purple-700/30"
                  >
                    {cap.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                  </span>
                ))}
              </div>
            </div>

            {/* Privacy & Pricing Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Privacy */}
              <div className="bg-[#12121a] rounded-xl p-6 border border-gray-800/50">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Privacy
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Inference</p>
                    <p className="text-gray-300">{agentInfo?.privacy.inference}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Storage</p>
                    <p className="text-gray-300">{agentInfo?.privacy.storage}</p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-[#12121a] rounded-xl p-6 border border-gray-800/50">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  Pricing
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Model</p>
                    <p className="text-gray-300 capitalize">{agentInfo?.pricing.model.replace("-", " ")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Price per Query</p>
                    <p className="text-2xl font-bold text-green-400">{agentInfo?.pricing.price}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Payment</p>
                    <p className="text-gray-300 uppercase">{agentInfo?.pricing.paymentMethod}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Proposal Context (if passed) */}
            {(proposalTitle || proposalDescription) && (
              <div className="mb-8 bg-blue-900/20 border border-blue-700/30 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Proposal Context
                </h3>
                {proposalTitle && (
                  <p className="text-gray-200 font-medium mb-2">{proposalTitle}</p>
                )}
                {proposalDescription && (
                  <p className="text-gray-400 text-sm">{proposalDescription.substring(0, 200)}...</p>
                )}
              </div>
            )}

            {/* Agent ID */}
            <div className="flex items-center justify-between text-sm text-gray-500 mb-8 px-2">
              <span>Agent ID: {agentInfo?.agentId || "Not registered"}</span>
              <span>ERC-8004 Verified</span>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleChatWithAgent}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-900/30 transition-all duration-200 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat with Agent
            </button>
          </div>
        </div>
      </Padder>
    </div>
  );
}
