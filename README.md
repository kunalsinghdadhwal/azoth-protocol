# Azoth DAO: Confidential DAO with Inco TEE

[![Inco Lightning](https://img.shields.io/badge/Inco%20Lightning-TEE-orange)](https://inco.org)
[![Base Sepolia](https://img.shields.io/badge/Base-Sepolia-blue)](https://base.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.30-blue)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)

Privacy-first DAO with encrypted voting, confidential balances, and zero-signature UX using Inco's Trusted Execution Environment.

---

## What We Built

A confidential governance system where:
- All balances are encrypted (cUSDC, vault shares, cGOV tokens)
- Votes remain private until voting ends
- Proposal amounts are hidden (prevents MEV/front-running)
- Session keys eliminate signature fatigue (93% reduction in MetaMask popups)

---

## Deployed Contracts (Base Sepolia)

| Contract | Address | Basescan |
|----------|---------|----------|
| CUSDCMarketplace | `0x637076397294eC96A92415Be58ca3e24fE44d529` | [View](https://sepolia.basescan.org/address/0x637076397294eC96A92415Be58ca3e24fE44d529) |
| ConfidentialVault | `0xb0C98C67150Ec4594E8b9F234A04468cCfC0dD82` | [View](https://sepolia.basescan.org/address/0xb0C98C67150Ec4594E8b9F234A04468cCfC0dD82) |
| ConfidentialGovernanceToken | `0xdA9B7d018e06f4CE070e708653da7629781A101b` | [View](https://sepolia.basescan.org/address/0xdA9B7d018e06f4CE070e708653da7629781A101b) |
| AzothDAO | `0x5d22F3621dD106Daf7Ea8EA7C93c8dF29f2Ae1e7` | [View](https://sepolia.basescan.org/address/0x5d22F3621dD106Daf7Ea8EA7C93c8dF29f2Ae1e7) |

---

## Core Features

### Encrypted Storage
```solidity
mapping(address => euint256) private _balances;  // Hidden token balances
euint256 public forVotes;                        // Hidden vote tallies
euint256 public requestedAmount;                 // Hidden proposal amounts
```

### Encrypted Operations in TEE
```solidity
euint256 newBalance = oldBalance.add(amount);    // Addition on encrypted values
ebool hasVoted = votes.gt(threshold);            // Comparison without decryption
```

### Session Key Pattern
```typescript
// Sign ONCE
const voucher = await grantSessionKeyVoucher({ expiresAt: oneHourLater });
// Decrypt UNLIMITED times (no more signatures)
const [balance, votes, shares] = await decryptWithVoucher({ handles, voucher });
```

### Dual-Token Architecture
- **cUSDC** (economic) - Purchase with ETH, deposit to vault
- **cGOV** (governance) - Mint with ETH, vote on proposals

---

## Documentation

### Smart Contracts
- [Contract Overview](apps/inco-lite-template/README-PROJECT.md)
- [Inco Smart Contract Guide](apps/inco-lite-template/README-INCO.md)

### Frontend
- [Frontend Overview](apps/nextjs-template/README-PROJECT.md)
- [Inco SDK Guide](apps/nextjs-template/README-INCO.md)

---

## Architecture

### Smart Contracts

| Contract | Purpose | Key Features |
|----------|---------|--------------|
| CUSDCMarketplace | Buy cUSDC with ETH | `euint256` balances, encrypted `.add()` |
| ConfidentialVault | ERC-4626 vault | Encrypted shares, `.mul()`, `.div()` |
| ConfidentialGovernanceToken | Soulbound governance | Non-transferable, encrypted minting |
| AzothDAO | Main governance | Encrypted voting, proposal amounts |

---

## Getting Started

### Prerequisites
- Node.js v18+
- pnpm or npm
- MetaMask wallet
- Base Sepolia testnet ETH

### Installation

```bash
git clone https://github.com/yourusername/azoth-protocol.git
cd azoth-protocol
pnpm install
```

### Environment Setup

Create `.env.local` in `apps/nextjs-template/`:
```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
```

### Run Frontend

```bash
cd apps/nextjs-template
pnpm dev
```

### Deploy Contracts

```bash
cd apps/inco-lite-template
npx hardhat compile
npx hardhat run scripts/deploy.ts --network baseSepolia
```

---

## User Flow

1. Purchase cUSDC (0.01 ETH = 20 cUSDC)
2. Deposit to Vault (receive encrypted shares)
3. Join DAO (requires vault shares)
4. Mint cGOV (0.01 ETH = 10 cGOV)
5. Create Proposal (encrypted amount)
6. Cast Vote (encrypted weight)
7. Enable Session Key (sign once)
8. Finalize Proposal (decrypt with session key)
9. Queue & Execute (timelock, transfer funds)

---

## Tech Stack

- **Blockchain**: Base Sepolia
- **Confidential Computing**: Inco Lightning Protocol
- **Smart Contracts**: Solidity 0.8.30, Hardhat, OpenZeppelin
- **Frontend**: Next.js 16.1, TypeScript 5.9, Privy, Wagmi, Viem

**Built for [Defy' 26](https://defy-26.devfolio.co) | Powered by Inco TEE**
