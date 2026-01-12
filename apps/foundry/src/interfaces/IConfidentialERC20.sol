// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {euint256, ebool} from "@inco/lightning/src/Lib.sol";

/// @title IConfidentialERC20
/// @notice Interface for Confidential ERC20 tokens using Inco's FHE
interface IConfidentialERC20 {
    // Events
    event Transfer(address indexed from, address indexed to, euint256 amount);
    event Approval(address indexed owner, address indexed spender, euint256 amount);
    event Mint(address indexed to, uint256 amount);
    event EncryptedMint(address indexed to, euint256 amount);

    // Errors
    error InsufficientFees();

    /// @notice Returns the name of the token
    function name() external view returns (string memory);

    /// @notice Returns the symbol of the token
    function symbol() external view returns (string memory);

    /// @notice Returns the decimals of the token
    function decimals() external view returns (uint8);

    /// @notice Returns the encrypted total supply
    function totalSupply() external view returns (euint256);

    /// @notice Returns the encrypted balance of an account
    /// @param account The address to query
    function balanceOf(address account) external view returns (euint256);

    /// @notice Returns the encrypted allowance
    /// @param owner The owner address
    /// @param spender The spender address
    function allowance(address owner, address spender) external view returns (euint256);

    /// @notice Transfer tokens using encrypted amount (for EOAs)
    /// @param to Recipient address
    /// @param encryptedAmount Encrypted amount bytes
    function transfer(address to, bytes calldata encryptedAmount) external payable returns (bool);

    /// @notice Transfer tokens using euint256 handle (for contracts)
    /// @param to Recipient address
    /// @param amount Encrypted amount handle
    function transfer(address to, euint256 amount) external returns (bool);

    /// @notice Approve spender using encrypted amount (for EOAs)
    /// @param spender Spender address
    /// @param encryptedAmount Encrypted amount bytes
    function approve(address spender, bytes calldata encryptedAmount) external payable returns (bool);

    /// @notice Approve spender using euint256 handle (for contracts)
    /// @param spender Spender address
    /// @param amount Encrypted amount handle
    function approve(address spender, euint256 amount) external returns (bool);

    /// @notice Transfer from using encrypted amount (for EOAs)
    /// @param from Sender address
    /// @param to Recipient address
    /// @param encryptedAmount Encrypted amount bytes
    function transferFrom(address from, address to, bytes calldata encryptedAmount) external payable returns (bool);

    /// @notice Transfer from using euint256 handle (for contracts)
    /// @param from Sender address
    /// @param to Recipient address
    /// @param amount Encrypted amount handle
    function transferFrom(address from, address to, euint256 amount) external returns (bool);

    /// @notice Mint tokens to owner (plaintext amount)
    /// @param amount Amount to mint
    function mint(uint256 amount) external;

    /// @notice Mint tokens using encrypted amount
    /// @param encryptedAmount Encrypted amount bytes
    function encryptedMint(bytes calldata encryptedAmount) external payable;
}
