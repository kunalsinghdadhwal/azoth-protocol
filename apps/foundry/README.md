## ShadowSwap Deployment - Base Sepolia

**Deployed on:** 2026-01-12

### Contract Addresses

| Contract | Address |
|----------|---------|
| **ShadowSwapFactory** | `0x71be5234DA70F2e7C64711E3c3352EAd5833ab1E` |
| **cUSDC** | `0x79a45178ac18Ffa0dd1f66936bd107F22F1a31c2` |
| **cETH** | `0xf89bcfF7d5F71B3fF78b43755Ae0fAc74BCAA8a9` |
| **cUSDC/cETH Pair** | `0xF3e41DcE7E7d0125F6a97ae11dFE777da17071DE` |

**Fee Setter:** `0x435800000093FCD40000D02d961b80006911f792`

**Network:** Base Sepolia (Chain ID: 84532)

**RPC URL:** https://sepolia.base.org

---

## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
