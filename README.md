# ShadowSwap: Confidential AMM with Built-in MEV Shield on Inco Network

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Hackathon Project](https://img.shields.io/badge/Hackathon-ETHGlobal%202026-blue)](https://ethglobal.com/)
[![Built with Inco](https://img.shields.io/badge/Built%20with-Inco%20Network-orange)](https://www.inco.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1-38B2AC)](https://tailwindcss.com/)

---

## Table of Contents

- [Overview](#overview)
- [Key Problems Solved](#key-problems-solved)
- [Features](#features)
- [Technical Architecture](#technical-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Deployment](#deployment)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [Security Considerations](#security-considerations)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Acknowledgments](#acknowledgments)
- [License](#license)

---

## Overview

ShadowSwap (also known as PrivAMM) is a privacy-first Automated Market Maker (AMM) protocol built on the Inco Network, leveraging Fully Homomorphic Encryption (FHE) via fhEVM to enable confidential trading. Traditional AMMs like Uniswap expose pool reserves, liquidity provider (LP) positions, swap sizes, and price impacts publicly, making them vulnerable to Maximum Extractable Value (MEV) attacks such as sandwiching and front-running. ShadowSwap solves this by keeping all sensitive data encrypted, ensuring true on-chain privacy while maintaining efficient price discovery and automated trading.

This project is inspired by Inco's flagship use cases for private AMMs and similar implementations like Zama's FHESwap. It's designed for hackathons like ETHGlobal, focusing on MEV resistance, institutional-grade privacy, and composability with Confidential ERC-20 tokens. Built in under 24 hours? Absolutely—prototype it on Base Sepolia testnet for a demo that wows judges!

### Why ShadowSwap?

| Traditional AMMs | ShadowSwap |
|------------------|------------|
| Public order flow visible to MEV bots | Encrypted transactions invisible to attackers |
| LP positions exposed on-chain | Hidden liquidity positions |
| Sandwich attacks commonplace | Zero-knowledge swap execution |
| Institutional adoption barriers | Enterprise-ready privacy |

### Key Problems Solved
- **MEV Exploitation**: No visible order flow or tx sizes—MEV bots can't front-run or sandwich.
- **LP Privacy**: Whales and institutions add/remove liquidity without revealing positions, preventing copycat strategies or impermanent loss sniping.
- **Institutional Barriers**: Enables large-volume, confidential trades on public blockchains, bridging DeFi to traditional finance.
- **Data Leaks**: All computations (swaps, price updates) occur on encrypted data, with selective decryption only for authorized users.

## Features
- **MEV Resistance**: Encrypted swaps and reserves prevent sandwich attacks and front-running.
- **LP Protection**: Hidden positions and contributions—perfect for high-value LPs.
- **Institutional Appeal**: Private, large-scale trading without relying on centralized exchanges.
- **Composable Privacy**: Integrates with Confidential ERC-20 for fully private token flows (e.g., stablecoins like cUSDC).
- **Hackathon Demo Power**: Compare a ShadowSwap tx (nothing leaked on explorer) vs. Uniswap (full visibility).
- **Fast & Secure**: Uses Inco Lightning (TEE mode) for low-latency operations and Ethos restaking for enhanced security.

## Technical Architecture

### 1. Core Smart Contract (Solidity on fhEVM)
- Extends Inco's library for encrypted types (`euint256` for reserves, balances).
- **Reserves**: Stored as encrypted values (`tokenA_reserve`, `tokenB_reserve`).
- **Swap Logic**: 
  - User encrypts input via IncoJS.
  - Constant product formula (x * y = k) computed blindly using FHE ops (add, mul, div).
  - Output decrypted only for the user via attested decryption.
- **Programmable Access Control**: Reveals data selectively (e.g., only to LPs or auditors).

### 2. Liquidity Management
- Add/remove liquidity with encrypted amounts.
- Mint/burn encrypted LP tokens (built on Confidential ERC-20 standard).
- Private fee accrual and distribution.

### 3. Price Discovery & Integrations
- **Oracles**: Chainlink for external price feeds (encrypted slippage checks, TWAP-like logic).
- **Constant Product AMM**: Adapted for FHE to maintain privacy without sacrificing efficiency.

### 4. Frontend & User Experience
- **Framework**: NextJS starter from Inco docs.
- **Auth**: Privy for seamless wallet login.
- **Encryption**: IncoJS SDK for client-side input encryption (swap amounts, min output).
- **UI Flow**: Users see only their decrypted results; pool stats remain hidden.

### 5. Security Enhancements
- **Restaking**: Ethos for pooled economic security.
- **Modes**: Inco Lightning (TEE) for demo speed; full FHE for production privacy.
- **Audits/Verification**: Attested compute for on-chain proofs of solvency (aggregate only).

## Getting Started

### Prerequisites
- Node.js v18+
- Yarn or npm
- Wallet (e.g., MetaMask) with testnet funds on Base Sepolia.
- Inco SDK and tools (install via `npm i incojs`).

### Installation
1. Clone the repo:
   ```
   git clone https://github.com/0xkun4l/shadowswap.git
   cd shadowswap
   ```
2. Install dependencies:
   ```
   yarn install
   ```
3. Set up environment variables (`.env` file):
   - `INCO_RPC_URL`: Base Sepolia RPC.
   - `CHAINLINK_FEED`: Oracle contract address.
   - `PRIVY_APP_ID`: Your Privy app ID.

### Deployment
- **Contracts**: Use Hardhat/Foundry (from Inco tutorials).
  ```
  npx hardhat deploy --network baseSepolia
  ```
- **Frontend**: Run locally:
  ```
  yarn dev
  ```
- Test on Base Sepolia explorer for privacy proofs.

### Usage Example
1. Connect wallet via Privy.
2. Encrypt and approve tokens.
3. Perform a swap: Input hidden, output decrypted only for you.
4. Add liquidity: Position encrypted—no one sees your stake.

## 24-Hour Hackathon Build Roadmap
- **0-4 Hours**: Fork Inco confidential token tutorial; deploy base cERC-20 pair.
- **4-10 Hours**: Core AMM—encrypted reserves, constant product swaps.
- **10-15 Hours**: Liquidity ops + encrypted LP minting.
- **15-20 Hours**: Integrations (Privy, IncoJS, Chainlink).
- **20-24 Hours**: Frontend, testing with Inco cheatcodes, demo prep.

## Potential Extensions
- Private fee distribution to LPs.
- Encrypted limit orders (price triggers).
- Multi-pool support or concentrated liquidity (V3-inspired).
- Integration with more oracles (e.g., Pyth for faster feeds).


## Deployed Contracts (Base Sepolia)

**Network:** Base Sepolia (Chain ID: 84532)
**RPC URL:** https://sepolia.base.org

| Contract | Address |
|----------|---------|
| **ShadowSwapFactory** | `0x71be5234DA70F2e7C64711E3c3352EAd5833ab1E` |
| **cUSDC** | `0x79a45178ac18Ffa0dd1f66936bd107F22F1a31c2` |
| **cETH** | `0xf89bcfF7d5F71B3fF78b43755Ae0fAc74BCAA8a9` |
| **cUSDC/cETH Pair** | `0xF3e41DcE7E7d0125F6a97ae11dFE777da17071DE` |

**Fee Setter:** `0x435800000093FCD40000D02d961b80006911f792`

## Acknowledgments
- Inco Network for fhEVM and confidential primitives.
- Zama for FHESwap inspiration.
- Circle for Confidential ERC-20 framework.
