import { addRpcUrlOverrideToChain } from "@privy-io/chains";
import { baseSepolia } from "viem/chains";

export const baseSepoliaWithRpc = addRpcUrlOverrideToChain(
  baseSepolia,
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org",
);

export const supportedChains = [baseSepoliaWithRpc] as const;
export const defaultChain = baseSepoliaWithRpc;

// Contract addresses on Base Sepolia
export const contracts = {
  shadowSwapFactory: "0x71be5234DA70F2e7C64711E3c3352EAd5833ab1E",
  cUSDC: "0x79a45178ac18Ffa0dd1f66936bd107F22F1a31c2",
  cETH: "0xf89bcfF7d5F71B3fF78b43755Ae0fAc74BCAA8a9",
  pair: "0xF3e41DcE7E7d0125F6a97ae11dFE777da17071DE",
} as const;
