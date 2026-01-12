import { ConnectButton } from "@rainbow-me/rainbowkit";

const Header = () => {
  return (
    <div className="flex items-center justify-between py-6 border-b border-[#1e1e2e] mb-8">
      <div className="flex items-center space-x-4">
        {/* Logo placeholder - replace with actual logo */}
        <div className="w-12 h-12 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/30">
          <span className="text-white font-bold text-2xl">A</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-100 tracking-tight">Azoth DAO</h1>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Confidential Governance</span>
            <span className="privacy-badge">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              FHE Protected
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-2 text-xs text-gray-500">
          <div className="status-dot status-active"></div>
          <span>Base Sepolia</span>
        </div>
        <ConnectButton />
      </div>
    </div>
  );
};

export default Header;
