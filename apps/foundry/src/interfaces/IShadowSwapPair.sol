// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {euint256, ebool} from "@inco/lightning/src/Lib.sol";

/// @title IShadowSwapPair
/// @notice Interface for ShadowSwap Pair - confidential AMM with encrypted reserves
interface IShadowSwapPair {
    // Events
    event Mint(address indexed sender, euint256 amount0, euint256 amount1);
    event Burn(address indexed sender, euint256 amount0, euint256 amount1, address indexed to);
    event Swap(
        address indexed sender,
        euint256 amount0In,
        euint256 amount1In,
        euint256 amount0Out,
        euint256 amount1Out,
        address indexed to
    );
    event Sync(euint256 reserve0, euint256 reserve1);

    /// @notice Returns minimum liquidity locked forever
    function MINIMUM_LIQUIDITY() external pure returns (uint256);

    /// @notice Returns factory address
    function factory() external view returns (address);

    /// @notice Returns first token address
    function token0() external view returns (address);

    /// @notice Returns second token address
    function token1() external view returns (address);

    /// @notice Returns encrypted reserves and last block timestamp
    function getReserves() external view returns (euint256 reserve0, euint256 reserve1, uint32 blockTimestampLast);

    /// @notice Returns encrypted price0 cumulative (for TWAP)
    function price0CumulativeLast() external view returns (euint256);

    /// @notice Returns encrypted price1 cumulative (for TWAP)
    function price1CumulativeLast() external view returns (euint256);

    /// @notice Returns kLast for protocol fee calculation
    function kLast() external view returns (euint256);

    /// @notice Mint LP tokens to address
    /// @param to Recipient of LP tokens
    /// @return liquidity Amount of LP tokens minted (encrypted)
    function mint(address to) external returns (euint256 liquidity);

    /// @notice Burn LP tokens and receive underlying tokens
    /// @param to Recipient of underlying tokens
    /// @return amount0 Amount of token0 received (encrypted)
    /// @return amount1 Amount of token1 received (encrypted)
    function burn(address to) external returns (euint256 amount0, euint256 amount1);

    /// @notice Swap tokens
    /// @param encAmount0Out Encrypted amount of token0 to receive
    /// @param encAmount1Out Encrypted amount of token1 to receive
    /// @param to Recipient address
    /// @param data Callback data for flash loans
    function swap(bytes calldata encAmount0Out, bytes calldata encAmount1Out, address to, bytes calldata data)
        external
        payable;

    /// @notice Force reserves to match balances
    function sync() external;

    /// @notice Skim excess tokens to address
    /// @param to Recipient of excess tokens
    function skim(address to) external;

    /// @notice Initialize pair with token addresses (called by factory)
    /// @param _token0 First token address
    /// @param _token1 Second token address
    function initialize(address _token0, address _token1) external;
}
