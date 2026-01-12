# ShadowSwap Frontend

## Project Overview

ShadowSwap (PrivAMM) is a privacy-first Automated Market Maker (AMM) built on Inco Network, leveraging Fully Homomorphic Encryption (FHE) via fhEVM for confidential trading. This is the frontend application for the protocol.

## Core Concepts

- **MEV Resistance**: Encrypted swaps and reserves prevent sandwich attacks and front-running
- **LP Privacy**: Hidden liquidity positions protect large-value LPs from copycat strategies
- **Confidential ERC-20**: All token flows are encrypted using Inco's confidential token standard
- **FHE Operations**: Swap calculations use encrypted types (`euint256`) for reserves and balances

## Tech Stack

- **Framework**: Next.js
- **Authentication**: Privy for wallet connection
- **Encryption**: IncoJS SDK for client-side input encryption
- **Styling**: Tailwind CSS with shadcn/ui components
- **Network**: Base Sepolia testnet (Inco Network)

## Key Features

- Encrypted swap amounts and minimum output values
- Private liquidity provision (add/remove)
- Selective decryption - users see only their own results
- Pool statistics remain hidden from public view

## Directory Structure

- `src/app/` - Next.js app router pages
- `src/components/` - React components
  - `blocks/` - Page section components (Hero, Features, Pricing, etc.)
  - `ui/` - Base UI components (shadcn/ui)
- `src/lib/` - Utility functions
- `src/actions/` - Server actions
- `src/styles/` - Global styles

## Development

```bash
pnpm install
pnpm dev
```

## Environment Variables

- `INCO_RPC_URL` - Base Sepolia RPC endpoint
- `CHAINLINK_FEED` - Oracle contract address
- `PRIVY_APP_ID` - Privy application ID
