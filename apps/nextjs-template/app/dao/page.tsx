"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import Padder from "@/components/padder";

export const dynamic = "force-dynamic";
import {
  CUSDCMarketplace,
  CGOVToken,
  ConfidentialVault,
  DAOMembership,
  Proposals,
} from "@/components/dao";
import { useAccount } from "wagmi";
import {
  CUSDC_MARKETPLACE_ADDRESS,
  CGOV_TOKEN_ADDRESS,
  CONFIDENTIAL_VAULT_ADDRESS,
  AZOTH_DAO_ADDRESS,
} from "@/utils/constants";

type Tab = "marketplace" | "vault" | "governance" | "membership" | "proposals";

const Page = () => {
  const [activeTab, setActiveTab] = useState<Tab>("marketplace");
  const [showDebug, setShowDebug] = useState(false);
  const { isConnected, address } = useAccount();

  useEffect(() => {
    console.log("[App] Contract Addresses:");
    console.log("  cUSDC Marketplace:", CUSDC_MARKETPLACE_ADDRESS);
    console.log("  cGOV Token:", CGOV_TOKEN_ADDRESS);
    console.log("  Confidential Vault:", CONFIDENTIAL_VAULT_ADDRESS);
    console.log("  Azoth DAO:", AZOTH_DAO_ADDRESS);
    console.log("[App] Connected address:", address);
  }, [address]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "marketplace", label: "cUSDC" },
    { id: "vault", label: "Vault" },
    { id: "governance", label: "cGOV" },
    { id: "membership", label: "Membership" },
    { id: "proposals", label: "Proposals" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Padder>
        <Header />
        
        {!isConnected ? (
          <div className="max-w-2xl mx-auto text-center py-20">
            {/* Hero Section */}
            <div className="relative mb-12">
              {/* Glow effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 bg-purple-600/20 rounded-full blur-3xl"></div>
              </div>
              
              {/* Logo placeholder */}
              <div className="relative w-24 h-24 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-900/50">
                <span className="text-white font-bold text-5xl">A</span>
              </div>
              
              <h2 className="text-4xl font-bold text-gray-100 mb-4 tracking-tight">
                Azoth DAO
              </h2>
              <p className="text-lg text-gray-400 mb-2">
                Confidential Governance Protocol
              </p>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Privacy-preserving DAO powered by fully homomorphic encryption. 
                Your votes, your balances, your privacy.
              </p>
            </div>

            {/* Privacy Features */}
            <div className="card p-8 max-w-lg mx-auto glow-purple">
              <h3 className="font-semibold text-gray-100 mb-6 flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Privacy Guarantees</span>
              </h3>
              <ul className="text-sm text-gray-400 space-y-4 text-left">
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Encrypted balances for cUSDC, cGOV, and vault shares</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Hidden vote weights prevent whale influence visibility</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Confidential proposal amounts until execution</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Only final vote outcome is revealed publicly</span>
                </li>
              </ul>
            </div>

            <p className="mt-8 text-gray-500 text-sm">
              Connect your wallet to get started
            </p>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex space-x-2 mb-8 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-item whitespace-nowrap ${activeTab === tab.id ? "active" : ""}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="max-w-2xl mx-auto">
              {activeTab === "marketplace" && <CUSDCMarketplace />}
              {activeTab === "vault" && <ConfidentialVault />}
              {activeTab === "governance" && <CGOVToken />}
              {activeTab === "membership" && <DAOMembership />}
              {activeTab === "proposals" && <Proposals />}
            </div>

            {/* Footer Info */}
            <div className="mt-12 max-w-2xl mx-auto">
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">
                  Protocol Parameters
                </h3>
                <div className="grid grid-cols-3 gap-6 text-center text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Voting Period</p>
                    <p className="font-semibold text-purple-400">~60 seconds</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Timelock</p>
                    <p className="font-semibold text-purple-400">10 seconds</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Quorum</p>
                    <p className="font-semibold text-purple-400">10%</p>
                  </div>
                </div>
              </div>
              
              {/* Debug Panel */}
              <div className="mt-4">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  {showDebug ? "Hide Debug Info" : "Show Debug Info"}
                </button>
                
                {showDebug && (
                  <div className="mt-3 card p-4 font-mono text-xs">
                    <p className="text-gray-500 mb-2">Contract Addresses (Base Sepolia):</p>
                    <p className="text-gray-400">cUSDC: <span className="text-purple-400">{CUSDC_MARKETPLACE_ADDRESS}</span></p>
                    <p className="text-gray-400">cGOV: <span className="text-purple-400">{CGOV_TOKEN_ADDRESS}</span></p>
                    <p className="text-gray-400">Vault: <span className="text-purple-400">{CONFIDENTIAL_VAULT_ADDRESS}</span></p>
                    <p className="text-gray-400">DAO: <span className="text-purple-400">{AZOTH_DAO_ADDRESS}</span></p>
                    <p className="mt-3 text-gray-500">Your Address:</p>
                    <p className="text-amber-400">{address}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </Padder>
    </div>
  );
};

export default Page;
