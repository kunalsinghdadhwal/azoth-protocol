import React from 'react';
import { Gem } from 'lucide-react';

const NavItem = ({ href, label }: { href: string; label: string }) => {
  return (
    <a
      href={href}
      className="group relative font-mono text-[10px] tracking-widest text-zinc-400 transition-colors duration-300 hover:text-white"
    >
      {/* Left Bracket */}
      <span className="absolute -left-2 top-0 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:-left-3 text-[#00f5ff] font-light">
        [
      </span>
      
      {/* Label */}
      <span className="relative z-10 group-hover:text-shadow-glow transition-all duration-300">
        {label}
      </span>
      
      {/* Right Bracket */}
      <span className="absolute -right-2 top-0 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:-right-3 text-[#00f5ff] font-light">
        ]
      </span>

      {/* Bottom Glow Line */}
      <span className="absolute -bottom-2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f5ff] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out opacity-50"></span>
    </a>
  );
};

const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 border-b border-[#e0f2fe]/5 bg-[#050505]/90 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto flex justify-between items-center px-8 h-24">
        {/* Logo Section */}
        <div className="flex items-center gap-5 group cursor-pointer">
          <div className="relative">
             <div className="absolute inset-0 bg-[#00f5ff] blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
             <Gem className="relative z-10 text-[#00f5ff] w-8 h-8 drop-shadow-[0_0_5px_rgba(0,245,255,0.8)] group-hover:rotate-180 transition-transform duration-700 ease-in-out" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-xl tracking-[0.25em] text-white uppercase group-hover:text-shadow-glow transition-all duration-300">Quantum_Vault</span>
            <div className="flex items-center gap-2">
                <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                <span className="font-mono text-[9px] text-[#e0f2fe]/50 tracking-[0.4em] group-hover:text-[#00f5ff]/80 transition-colors">INTERFACE_ONLINE</span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <div className="hidden lg:flex items-center gap-16">
          <NavItem href="#core" label="THE_SHARD" />
          <NavItem href="#protocols" label="ENCRYPTION_LOGS" />
          <NavItem href="#sigils" label="DAO_GOVERNANCE" />
          
          {/* Action Button */}
          <button className="group relative px-6 py-3 overflow-hidden bg-transparent border border-[#00f5ff]/20 hover:border-[#00f5ff]/50 transition-colors duration-300">
            {/* Background Fill Animation */}
            <div className="absolute inset-0 w-full h-full bg-[#00f5ff]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00f5ff] opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00f5ff] opacity-50 group-hover:opacity-100 transition-opacity"></div>

            {/* Content */}
            <span className="relative z-10 font-mono text-[10px] font-bold tracking-[0.2em] text-[#00f5ff] group-hover:text-white transition-colors duration-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#00f5ff] rounded-none group-hover:animate-ping"></span>
                CONNECT_WALLET
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;