import React from 'react';
import { RefreshCcw } from 'lucide-react';
import ScrambleText from './ScrambleText';
import CipherRings from './CipherRings';
import TerminalLog from './TerminalLog';

const CoreSection: React.FC = () => {
  return (
    <section id="core" className="py-32 px-8 relative w-full overflow-hidden">
      {/* Unique BG for Core: Dark Grid + Gradient */}
      <div className="absolute inset-0 bg-[#020202]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#00f5ff]/5 to-transparent"></div>
          
          {/* Animated Cipher Rings Background */}
          <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2">
             <CipherRings />
          </div>
      </div>

      <div className="max-w-[1600px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <div className="relative group">
            <div className="absolute -inset-10 bg-[#00f5ff]/5 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
            <div className="relative glass-panel p-2">
              <div className="border border-[#e0f2fe]/10 p-4 relative overflow-hidden">
                <img 
                  alt="The Core Crystalline Structure" 
                  className="w-full h-auto opacity-70 group-hover:opacity-100 transition-all duration-1000 grayscale contrast-125 mix-blend-lighten" 
                  src="https://images.unsplash.com/photo-1618557219629-9e79435b863a?q=80&w=2600&auto=format&fit=crop" 
                />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDI0NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-50"></div>
              </div>
              <div className="absolute top-4 right-6 p-2 font-mono text-[9px] text-[#00f5ff] tracking-widest border border-[#00f5ff]/20 bg-black/50 backdrop-blur">
                SHARD_RENDER_01
              </div>
              
              {/* Terminal Log Overlay */}
              <div className="absolute bottom-4 left-4 right-4 p-4 border-t border-[#00f5ff]/10 bg-black/80 backdrop-blur-md">
                 <TerminalLog />
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 glass-panel flex flex-col justify-center items-center z-10">
              <RefreshCcw className="w-8 h-8 text-[#e0f2fe] animate-spin-slow mb-2" />
              <span className="font-mono text-[7px] text-center tracking-widest text-[#00f5ff]">PROCESSING</span>
            </div>
          </div>
          
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="w-6 h-[1px] bg-[#00f5ff] shadow-[0_0_5px_rgba(0,245,255,0.5)]"></span>
              <span className="font-mono text-[#00f5ff] text-xs tracking-widest uppercase">Encryption_Phase_01</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl font-black text-white mb-12 tracking-tighter leading-tight">
              THE SHARD<br />
              <span className="text-[#e0f2fe]"><ScrambleText text="SYNTHESIS" hoverTrigger={true} /></span>
            </h2>
            
            <div className="space-y-10">
              {[
                {
                    id: "01",
                    title: "CRYSTALLINE_STORAGE",
                    desc: "Data is physically manifested into 4D crystalline structures. Rotating across fractal dimensions to prevent brute-force deciphering from classical observers."
                },
                {
                    id: "02",
                    title: "OBSIDIAN_OBLIVION",
                    desc: "Our interface operates on a self-immolating kernel. Every transaction triggers a local reset of the encryption shards, leaving zero trace in the galactic history."
                },
                {
                    id: "03",
                    title: "FRACTAL_DECRYPTION",
                    desc: "Only those holding the resonant frequency keys can align the floating structures to reveal the hidden truth within the vault's core."
                }
              ].map((item) => (
                <div key={item.id} className="cursor-pointer group pl-4 border-l border-white/5 hover:border-[#00f5ff] transition-colors">
                  <div className="flex items-start gap-6">
                    <span className="font-mono text-[#e0f2fe] text-sm font-bold mt-1">{item.id}</span>
                    <div>
                      <h3 className="font-display text-xl font-bold text-white mb-2 group-hover:text-[#00f5ff] transition-colors">{item.title}</h3>
                      <p className="font-mono text-xs leading-relaxed text-zinc-300 group-hover:text-[#e0f2fe] max-w-lg blur-sm group-hover:blur-none transition-all duration-700 ease-in-out">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoreSection;