// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {euint256} from "@inco/lightning/src/Lib.sol";

/// @title IShadowSwapCallee
/// @notice Interface for flash loan callback
interface IShadowSwapCallee {
    /// @notice Called by ShadowSwapPair during swap for flash loan functionality
    /// @param sender The address that initiated the swap
    /// @param amount0Out Encrypted amount of token0 sent to callee
    /// @param amount1Out Encrypted amount of token1 sent to callee
    /// @param data Arbitrary data passed through by the caller
    function shadowSwapCall(address sender, euint256 amount0Out, euint256 amount1Out, bytes calldata data) external;
}
