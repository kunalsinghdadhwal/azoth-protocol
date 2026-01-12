'use client';

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Gem, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${collapsed ? 'h-12' : 'h-16'}`}>
      <div className="h-full glass-panel border-b border-[#e0f2fe]/5">
        <div className="h-full max-w-full mx-auto flex items-center justify-between px-4 lg:px-6">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#00f5ff] blur-sm opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <Gem className={`relative z-10 text-[#00f5ff] transition-all duration-300 ${collapsed ? 'w-5 h-5' : 'w-6 h-6'}`} />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <h1 className="font-display font-bold text-base lg:text-lg tracking-[0.2em] text-white uppercase">
                  AZOTH_PROTOCOL
                </h1>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="font-mono text-[8px] text-[#e0f2fe]/50 tracking-[0.3em]">ONLINE</span>
                </div>
              </div>
            )}
            {collapsed && (
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#00f5ff] font-bold">QV</span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Network Badge */}
            {!collapsed && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 border border-[#e0f2fe]/10 bg-[#e0f2fe]/5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="font-mono text-[9px] tracking-[0.15em] text-[#e0f2fe]">BASE</span>
              </div>
            )}

            {/* Connect Button */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

                return (
                  <div {...(!ready && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' } })}>
                    {(() => {
                      if (!connected) {
                        return (
                          <button 
                            onClick={openConnectModal} 
                            className={`group relative overflow-hidden bg-transparent border border-[#00f5ff]/20 hover:border-[#00f5ff]/50 transition-all duration-300 ${collapsed ? 'px-3 py-1.5' : 'px-4 py-2'}`}
                          >
                            <div className="absolute inset-0 bg-[#00f5ff]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span className={`relative z-10 font-mono font-bold tracking-[0.15em] text-[#00f5ff] group-hover:text-white transition-colors flex items-center gap-1.5 ${collapsed ? 'text-[8px]' : 'text-[9px]'}`}>
                              <span className="w-1 h-1 bg-[#00f5ff] group-hover:animate-ping"></span>
                              {collapsed ? 'CONNECT' : 'CONNECT_WALLET'}
                            </span>
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button onClick={openChainModal} className={`group relative overflow-hidden border border-red-500/20 hover:border-red-500/50 transition-all ${collapsed ? 'px-3 py-1.5' : 'px-4 py-2'}`}>
                            <div className="absolute inset-0 bg-red-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span className={`relative z-10 font-mono font-bold tracking-[0.15em] text-red-500 group-hover:text-white flex items-center gap-1.5 ${collapsed ? 'text-[8px]' : 'text-[9px]'}`}>
                              <span className="w-1 h-1 bg-red-500 animate-pulse"></span>
                              WRONG_NET
                            </span>
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-2">
                          {!collapsed && (
                            <button onClick={openChainModal} className="hidden sm:block group relative px-3 py-1.5 overflow-hidden border border-[#e0f2fe]/10 hover:border-[#e0f2fe]/30 transition-all">
                              <div className="absolute inset-0 bg-[#e0f2fe]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                              <span className="relative z-10 font-mono text-[8px] tracking-[0.1em] text-[#e0f2fe] group-hover:text-white flex items-center gap-1.5">
                                {chain.hasIcon && (
                                  <div style={{ background: chain.iconBackground, width: 8, height: 8, borderRadius: 999, overflow: 'hidden' }}>
                                    {chain.iconUrl && <img alt={chain.name ?? 'Chain'} src={chain.iconUrl} style={{ width: 8, height: 8 }} />}
                                  </div>
                                )}
                                <span className="hidden lg:inline">{chain.name}</span>
                              </span>
                            </button>
                          )}
                          <button onClick={openAccountModal} className={`group relative overflow-hidden border border-[#00f5ff]/20 hover:border-[#00f5ff]/50 transition-all ${collapsed ? 'px-3 py-1.5' : 'px-4 py-2'}`}>
                            <div className="absolute inset-0 bg-[#00f5ff]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span className={`relative z-10 font-mono font-bold tracking-[0.1em] text-[#00f5ff] group-hover:text-white flex items-center gap-1.5 ${collapsed ? 'text-[8px]' : 'text-[9px]'}`}>
                              <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                              <span className="max-w-[70px] truncate">{collapsed ? account.displayName.split('.')[0] : account.displayName}</span>
                            </span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>

            {/* Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="ml-2 p-1.5 border border-[#e0f2fe]/10 hover:border-[#00f5ff]/30 transition-all hover:bg-[#00f5ff]/5"
              title={collapsed ? "Expand header" : "Collapse header"}
            >
              {collapsed ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#00f5ff]" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-[#00f5ff]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
       