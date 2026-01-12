// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IShadowSwapPair} from "../interfaces/IShadowSwapPair.sol";
import {IShadowSwapFactory} from "../interfaces/IShadowSwapFactory.sol";
import {euint256, e} from "@inco/lightning/src/Lib.sol";

/// @title ShadowSwapLibrary
/// @notice Library for ShadowSwap utility functions
library ShadowSwapLibrary {
    /// @notice Sort tokens to ensure consistent ordering
    /// @param tokenA First token
    /// @param tokenB Second token
    /// @return token0 Lower address token
    /// @return token1 Higher address token
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "ShadowSwapLibrary: IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "ShadowSwapLibrary: ZERO_ADDRESS");
    }

    /// @notice Calculate pair address using CREATE2
    /// @param factory Factory address
    /// @param tokenA First token
    /// @param tokenB Second token
    /// @return pair Calculated pair address
    function pairFor(address factory, address tokenA, address tokenB) internal pure returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            hex"ff",
                            factory,
                            keccak256(abi.encodePacked(token0, token1)),
                            hex"96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f" // init code hash
                        )
                    )
                )
            )
        );
    }

    /// @notice Get encrypted reserves for a pair
    /// @param factory Factory address
    /// @param tokenA First token
    /// @param tokenB Second token
    /// @return reserveA Reserve of tokenA (encrypted)
    /// @return reserveB Reserve of tokenB (encrypted)
    function getReserves(address factory, address tokenA, address tokenB)
        internal
        view
        returns (euint256 reserveA, euint256 reserveB)
    {
        (address token0,) = sortTokens(tokenA, tokenB);
        (euint256 reserve0, euint256 reserve1,) =
            IShadowSwapPair(IShadowSwapFactory(factory).getPair(tokenA, tokenB)).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    /// @notice Calculate encrypted output amount for a swap
    /// @dev Uses constant product formula with 0.3% fee
    /// @param amountIn Input amount (encrypted)
    /// @param reserveIn Reserve of input token (encrypted)
    /// @param reserveOut Reserve of output token (encrypted)
    /// @return amountOut Output amount (encrypted)
    function getAmountOut(euint256 amountIn, euint256 reserveIn, euint256 reserveOut)
        internal
        returns (euint256 amountOut)
    {
        // amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
        euint256 amountInWithFee = e.mul(amountIn, e.asEuint256(997));
        euint256 numerator = e.mul(amountInWithFee, reserveOut);
        euint256 denominator = e.add(e.mul(reserveIn, e.asEuint256(1000)), amountInWithFee);
        amountOut = e.div(numerator, denominator);
    }

    /// @notice Calculate encrypted input amount for a swap
    /// @dev Inverse of getAmountOut
    /// @param amountOut Desired output amount (encrypted)
    /// @param reserveIn Reserve of input token (encrypted)
    /// @param reserveOut Reserve of output token (encrypted)
    /// @return amountIn Required input amount (encrypted)
    function getAmountIn(euint256 amountOut, euint256 reserveIn, euint256 reserveOut)
        internal
        returns (euint256 amountIn)
    {
        // amountIn = (reserveIn * amountOut * 1000) / ((reserveOut - amountOut) * 997) + 1
        euint256 numerator = e.mul(e.mul(reserveIn, amountOut), e.asEuint256(1000));
        euint256 denominator = e.mul(e.sub(reserveOut, amountOut), e.asEuint256(997));
        amountIn = e.add(e.div(numerator, denominator), e.asEuint256(1));
    }

    /// @notice Quote amount of tokenB given amount of tokenA based on reserves
    /// @param amountA Amount of tokenA
    /// @param reserveA Reserve of tokenA (encrypted)
    /// @param reserveB Reserve of tokenB (encrypted)
    /// @return amountB Equivalent amount of tokenB (encrypted)
    function quote(euint256 amountA, euint256 reserveA, euint256 reserveB) internal returns (euint256 amountB) {
        // amountB = amountA * reserveB / reserveA
        amountB = e.div(e.mul(amountA, reserveB), reserveA);
    }
}
