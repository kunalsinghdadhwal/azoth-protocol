// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IShadowSwapFactory
/// @notice Interface for ShadowSwap Factory - creates and manages trading pairs
interface IShadowSwapFactory {
    // Events
    event PairCreated(address indexed token0, address indexed token1, address pair, uint256 pairCount);

    /// @notice Returns the fee recipient address
    function feeTo() external view returns (address);

    /// @notice Returns the address that can change feeTo
    function feeToSetter() external view returns (address);

    /// @notice Returns the pair address for two tokens
    /// @param tokenA First token address
    /// @param tokenB Second token address
    function getPair(address tokenA, address tokenB) external view returns (address pair);

    /// @notice Returns the pair address at index
    /// @param index Index in allPairs array
    function allPairs(uint256 index) external view returns (address pair);

    /// @notice Returns total number of pairs
    function allPairsLength() external view returns (uint256);

    /// @notice Creates a new trading pair
    /// @param tokenA First token address
    /// @param tokenB Second token address
    /// @return pair The created pair address
    function createPair(address tokenA, address tokenB) external returns (address pair);

    /// @notice Sets the fee recipient
    /// @param _feeTo New fee recipient address
    function setFeeTo(address _feeTo) external;

    /// @notice Sets the fee setter address
    /// @param _feeToSetter New fee setter address
    function setFeeToSetter(address _feeToSetter) external;
}
