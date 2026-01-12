// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {inco, e, euint256, ebool} from "@inco/lightning/src/Lib.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CUSDCMarketplace
 * @notice Allows users to purchase confidential USDC (cUSDC) with Base Sepolia ETH
 * @dev This separates economic stake acquisition from governance token minting
 * 
 * Key Features:
 * - Exchange ETH for encrypted cUSDC tokens
 * - All balances are encrypted using Inco FHE
 * - Supports authorized vault transfers
 */
contract CUSDCMarketplace is Ownable, ReentrancyGuard {
    using e for euint256;
    using e for ebool;
    using e for uint256;

    // ============ Errors ============
    error InsufficientFees();
    error MustSendETH();
    error UnauthorizedTransfer();
    error InsufficientBalance();
    error NoETHToWithdraw();
    error ETHTransferFailed();

    // ============ Events ============
    event CUSDCPurchased(address indexed buyer, uint256 ethAmount);
    event Transfer(address indexed from, address indexed to);
    event VaultAuthorized(address indexed vault);

    // ============ Constants ============
    // Exchange rate: 1 ETH = EXCHANGE_RATE cUSDC (scaled by 1e6 for USDC decimals)
    uint256 public constant EXCHANGE_RATE = 2000 * 1e6; // 2000 USDC per ETH
    uint8 public constant decimals = 6;
    string public constant name = "Confidential USDC";
    string public constant symbol = "cUSDC";

    // ============ State Variables ============
    // Mapping of encrypted cUSDC balances
    mapping(address => euint256) internal _balances;
    
    // Total cUSDC minted (encrypted)
    euint256 public totalMinted;
    
    // Authorized vault address for transfers
    address public authorizedVault;

    // ============ Constructor ============
    constructor() Ownable(msg.sender) {
        // Initialize totalMinted to encrypted zero
        totalMinted = uint256(0).asEuint256();
        totalMinted.allowThis();
    }

    // ============ Modifiers ============
    modifier onlyAuthorizedVault() {
        if (msg.sender != authorizedVault && msg.sender != owner()) {
            revert UnauthorizedTransfer();
        }
        _;
    }

    // ============ Core Functions ============

    /**
     * @notice Purchase cUSDC with ETH
     * @dev Mints encrypted cUSDC based on ETH sent
     */
    function purchaseCUSDC() external payable nonReentrant {
        if (msg.value == 0) revert MustSendETH();
        
        // Calculate cUSDC amount (ETH * EXCHANGE_RATE)
        // Since ETH has 18 decimals and USDC has 6, we need to adjust
        uint256 cUSDCAmount = (msg.value * EXCHANGE_RATE) / 1e18;
        
        euint256 encryptedAmount = cUSDCAmount.asEuint256();
        
        // Update user balance
        if (euint256.unwrap(_balances[msg.sender]) == bytes32(0)) {
            _balances[msg.sender] = encryptedAmount;
        } else {
            _balances[msg.sender] = _balances[msg.sender].add(encryptedAmount);
        }
        
        // Update total minted
        totalMinted = totalMinted.add(encryptedAmount);
        
        // Grant access permissions
        _balances[msg.sender].allowThis();
        _balances[msg.sender].allow(msg.sender);
        totalMinted.allowThis();
        
        emit CUSDCPurchased(msg.sender, msg.value);
    }

    /**
     * @notice Get user's cUSDC balance handle
     * @param user Address to query
     * @return User's encrypted cUSDC balance
     */
    function balanceOf(address user) external view returns (euint256) {
        return _balances[user];
    }

    /**
     * @notice Transfer cUSDC from one address to another
     * @dev Only callable by authorized vault or owner
     * @param from Source address
     * @param to Destination address  
     * @param amount Encrypted amount to transfer
     */
    function transferFrom(
        address from, 
        address to, 
        euint256 amount
    ) external onlyAuthorizedVault {
        euint256 fromBalance = _balances[from];
        
        // Check sufficient balance using FHE comparison
        ebool hasSufficient = fromBalance.ge(amount);
        
        // Use multiplexer pattern - only transfer if sufficient balance
        euint256 transferAmount = hasSufficient.select(amount, uint256(0).asEuint256());
        
        // Subtract from sender
        _balances[from] = fromBalance.sub(transferAmount);
        
        // Add to receiver
        if (euint256.unwrap(_balances[to]) == bytes32(0)) {
            _balances[to] = transferAmount;
        } else {
            _balances[to] = _balances[to].add(transferAmount);
        }
        
        // Update permissions
        _balances[from].allowThis();
        _balances[from].allow(from);
        _balances[to].allowThis();
        _balances[to].allow(to);
        
        // Allow vault to access balances
        if (authorizedVault != address(0)) {
            _balances[from].allow(authorizedVault);
            _balances[to].allow(authorizedVault);
        }

        emit Transfer(from, to);
    }

    /**
     * @notice Internal transfer for vault deposits
     * @dev Called by vault during deposit
     */
    function vaultTransfer(
        address from,
        euint256 amount
    ) external onlyAuthorizedVault returns (euint256 transferredAmount) {
        euint256 fromBalance = _balances[from];
        
        // Check sufficient balance
        ebool hasSufficient = fromBalance.ge(amount);
        
        // Only transfer if sufficient
        transferredAmount = hasSufficient.select(amount, uint256(0).asEuint256());
        
        // Subtract from sender
        _balances[from] = fromBalance.sub(transferredAmount);
        
        // Add to vault
        if (euint256.unwrap(_balances[authorizedVault]) == bytes32(0)) {
            _balances[authorizedVault] = transferredAmount;
        } else {
            _balances[authorizedVault] = _balances[authorizedVault].add(transferredAmount);
        }
        
        // Update permissions
        _balances[from].allowThis();
        _balances[from].allow(from);
        _balances[authorizedVault].allowThis();
        _balances[authorizedVault].allow(authorizedVault);
        
        transferredAmount.allowThis();
        transferredAmount.allow(from);
        
        return transferredAmount;
    }

    /**
     * @notice Transfer cUSDC from vault to user (for withdrawals)
     */
    function vaultWithdraw(
        address to,
        euint256 amount
    ) external onlyAuthorizedVault returns (euint256 withdrawnAmount) {
        euint256 vaultBalance = _balances[authorizedVault];
        
        // Check sufficient balance
        ebool hasSufficient = vaultBalance.ge(amount);
        
        // Only withdraw if sufficient
        withdrawnAmount = hasSufficient.select(amount, uint256(0).asEuint256());
        
        // Subtract from vault
        _balances[authorizedVault] = vaultBalance.sub(withdrawnAmount);
        
        // Add to user
        if (euint256.unwrap(_balances[to]) == bytes32(0)) {
            _balances[to] = withdrawnAmount;
        } else {
            _balances[to] = _balances[to].add(withdrawnAmount);
        }
        
        // Update permissions
        _balances[authorizedVault].allowThis();
        _balances[authorizedVault].allow(authorizedVault);
        _balances[to].allowThis();
        _balances[to].allow(to);
        
        withdrawnAmount.allowThis();
        withdrawnAmount.allow(to);
        
        return withdrawnAmount;
    }

    // ============ Admin Functions ============

    /**
     * @notice Set the authorized vault address
     * @param vault Address of the ConfidentialVault contract
     */
    function setAuthorizedVault(address vault) external onlyOwner {
        authorizedVault = vault;
        emit VaultAuthorized(vault);
    }

    /**
     * @notice Owner can withdraw collected ETH
     */
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoETHToWithdraw();
        (bool success, ) = owner().call{value: balance}("");
        if (!success) revert ETHTransferFailed();
    }
}
