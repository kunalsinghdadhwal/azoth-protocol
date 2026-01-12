// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {euint256} from "@inco/lightning/src/Lib.sol";

/// @title IShadowSwapERC20
/// @notice Interface for ShadowSwap LP token with encrypted balances
interface IShadowSwapERC20 {
    // Events
    event Approval(address indexed owner, address indexed spender, euint256 value);
    event Transfer(address indexed from, address indexed to, euint256 value);

    /// @notice Returns the token name
    function name() external pure returns (string memory);

    /// @notice Returns the token symbol
    function symbol() external pure returns (string memory);

    /// @notice Returns the number of decimals
    function decimals() external pure returns (uint8);

    /// @notice Returns the encrypted total supply
    function totalSupply() external view returns (euint256);

    /// @notice Returns the encrypted balance of an address
    /// @param owner Address to query
    function balanceOf(address owner) external view returns (euint256);

    /// @notice Returns the encrypted allowance
    /// @param owner Token owner
    /// @param spender Spender address
    function allowance(address owner, address spender) external view returns (euint256);

    /// @notice Approve spender with encrypted amount (EOA)
    /// @param spender Spender address
    /// @param encValue Encrypted amount bytes
    function approve(address spender, bytes calldata encValue) external payable returns (bool);

    /// @notice Approve spender with euint256 handle (contracts)
    /// @param spender Spender address
    /// @param value Encrypted amount handle
    function approve(address spender, euint256 value) external returns (bool);

    /// @notice Transfer tokens with encrypted amount (EOA)
    /// @param to Recipient address
    /// @param encValue Encrypted amount bytes
    function transfer(address to, bytes calldata encValue) external payable returns (bool);

    /// @notice Transfer tokens with euint256 handle (contracts)
    /// @param to Recipient address
    /// @param value Encrypted amount handle
    function transfer(address to, euint256 value) external returns (bool);

    /// @notice Transfer tokens from another address with encrypted amount (EOA)
    /// @param from Sender address
    /// @param to Recipient address
    /// @param encValue Encrypted amount bytes
    function transferFrom(address from, address to, bytes calldata encValue) external payable returns (bool);

    /// @notice Transfer tokens from another address with euint256 handle (contracts)
    /// @param from Sender address
    /// @param to Recipient address
    /// @param value Encrypted amount handle
    function transferFrom(address from, address to, euint256 value) external returns (bool);

    /// @notice Returns the EIP-712 domain separator
    function DOMAIN_SEPARATOR() external view returns (bytes32);

    /// @notice Returns the permit typehash
    function PERMIT_TYPEHASH() external pure returns (bytes32);

    /// @notice Returns the nonce for an address
    /// @param owner Address to query
    function nonces(address owner) external view returns (uint256);

    /// @notice Approve via signature (EIP-2612)
    /// @param owner Token owner
    /// @param spender Spender address
    /// @param value Amount to approve (plaintext for signature)
    /// @param deadline Signature expiry
    /// @param v Signature v
    /// @param r Signature r
    /// @param s Signature s
    function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
        external;
}
