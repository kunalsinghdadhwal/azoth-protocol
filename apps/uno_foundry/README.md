# **Confidential UNO Game - Hardhat Project**

A confidential UNO card game built with **Inco Lightning SDK** for privacy-preserving gameplay on Base Sepolia.

## **Overview**

This project implements a fully confidential UNO game where:
- Card hands are encrypted and only visible to their owners
- The deck is cryptographically shuffled using Inco's `shuffledRange`
- Game moves are committed as encrypted values
- Final game state can be revealed for verification

## **Setup Instructions**

### **1. Install Dependencies**
```sh
pnpm install
```

### **2. Configure Environment Variables**

Create a `.env` file with your configuration:

```plaintext
# Private key funded with ETH on Base Sepolia
PRIVATE_KEY_BASE_SEPOLIA="your_private_key_here"

# RPC URLs
LOCAL_CHAIN_RPC_URL="http://localhost:8545"
BASE_SEPOLIA_RPC_URL="https://base-sepolia-rpc.publicnode.com"
```

### **3. Compile Smart Contracts**
```sh
pnpm hardhat compile
```

### **4. Deploy to Base Sepolia**
```sh
npx hardhat ignition deploy ignition/modules/ConfidentialUnoGame.ts --network baseSepolia
```

### **5. Run Tests (Local)**
```sh
docker compose up  # Start local node + covalidator
pnpm hardhat test --network anvil
```

---

## **Deployed Contracts**

### ConfidentialUnoGame (v3)

| Network | Address | Explorer |
|---------|---------|----------|
| Base Sepolia | `0x5a81f4F50A6ACCA3965E4098E32f75E532556cDc` | [View on BaseScan](https://sepolia.basescan.org/address/0x5a81f4F50A6ACCA3965E4098E32f75E532556cDc) |

**Previous Versions:**
| Version | Address | Notes |
|---------|---------|-------|
| v2 | `0xCCC606643887db32cc6a398236346389Db36A088` | Fixed initial dealing ACL |
| v1 | `0xDb1b390A5197A92dD44E8De6A20fDb04d53ab605` | Initial deployment (ACL bug) |

---

## **Key Features**

### Encrypted Game State
- **Deck**: Shuffled using `ePreview.shuffledRange(0, 108)` for 108 UNO cards
- **Player Hands**: Stored as `elist` per player - only the owner can decrypt
- **Move History**: Encrypted moves appended to an `elist`
- **Top Card**: Encrypted, revealed to all players in the game

### Access Control (ACL)
The contract properly grants ACL permissions for:
- **elist handles**: For list operations (slice, append, etc.)
- **Individual card handles**: For `attestedDecrypt` operations

> **Important**: When using Inco's EList, individual elements extracted via `getEuint256()` require explicit ACL grants. The contract handles this during card dealing.

### Game Flow
1. **Create Game**: Shuffles deck, deals 7 cards to each player
2. **Join Game**: Players join lobby, receive dealt cards
3. **Start Game**: Begins play, all players can see top card
4. **Play Cards**: Players commit encrypted moves on their turn
5. **Draw Cards**: Players draw from encrypted deck
6. **End Game**: Final state revealed for verification

---

## **Contract Architecture**

```
ConfidentialUnoGame.sol
├── createGame()      - Create game with shuffled deck
├── joinGame()        - Join lobby and receive cards
├── startGame()       - Begin gameplay
├── commitMove()      - Play an encrypted card
├── drawCard()        - Draw from deck
├── endGame()         - Reveal final state
└── View Functions
    ├── getGame()           - Get game state
    ├── getPlayerHandSize() - Get hand size (public)
    ├── getCardFromHand()   - Get card handle for decryption
    └── getActiveGames()    - List active games
```

---

## **Inco Lightning Integration**

### Dependencies
```json
{
  "@inco/lightning": "0.7.10",
  "@inco/lightning-preview": "0.7.10"
}
```

### Key Imports
```solidity
import {euint256, ebool, e, inco} from "@inco/lightning/src/Lib.sol";
import {ePreview, elist, ETypes} from "@inco/lightning-preview/src/Preview.Lib.sol";
```

### ACL Best Practices
Always grant ACL when extracting elements from an elist:
```solidity
euint256 card = ePreview.getEuint256(hand, index);
inco.allow(euint256.unwrap(card), player);    // Grant to user
inco.allow(euint256.unwrap(card), address(this)); // Grant to contract
```

---

## **Frontend Integration**

Update the contract address in your frontend:
```typescript
// apps/nextjs-template/utils/uno/constants.ts
export const UNO_GAME_ADDRESS = "0x5a81f4F50A6ACCA3965E4098E32f75E532556cDc";
```

### Decryption Flow
1. Call `getCardFromHand()` to get encrypted card handle
2. Use Inco JS SDK's `attestedDecrypt()` with the handle
3. Decode the decrypted value to card data

---

## **Troubleshooting**

### ACL Disallowed Error
If you see `"acl disallowed"` when decrypting:
- Ensure the contract version grants ACL for individual card handles
- Verify you're using the latest deployed contract address
- Check that the wallet address matches the player in the game

### Fee Errors
Ensure sufficient ETH is sent with transactions:
- `createGame()`: ~3x encryption fee for bot games
- `joinGame()`: ~1x encryption fee
- `commitMove()`: ~1x encryption fee
- `drawCard()`: ~1x encryption fee
