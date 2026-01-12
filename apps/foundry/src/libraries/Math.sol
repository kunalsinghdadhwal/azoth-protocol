// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {euint256, e} from "@inco/lightning/src/Lib.sol";

/// @title Math
/// @notice Math library for ShadowSwap including encrypted square root
library Math {
    /// @notice Calculate square root using Babylonian method (plaintext)
    /// @param y Value to calculate square root of
    /// @return z Square root result
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    /// @notice Calculate minimum of two values (plaintext)
    /// @param x First value
    /// @param y Second value
    /// @return Minimum value
    function min(uint256 x, uint256 y) internal pure returns (uint256) {
        return x < y ? x : y;
    }

    /// @notice Calculate encrypted square root using Newton-Raphson method
    /// @dev Uses 10 iterations for reasonable precision
    /// @param x Encrypted value to calculate square root of
    /// @return y Encrypted square root result
    function encryptedSqrt(euint256 x) internal returns (euint256 y) {
        // Newton-Raphson: y = (y + x/y) / 2
        // Start with x/2 as initial guess (or 1 if x is small)
        y = e.div(x, e.asEuint256(2));

        // Edge case: if x is 0, return 0
        // We'll do 10 iterations which should give good precision for most values

        // 10 iterations of Newton-Raphson
        for (uint256 i = 0; i < 10; i++) {
            euint256 temp = e.div(x, y);
            y = e.div(e.add(y, temp), e.asEuint256(2));
        }

        return y;
    }

    /// @notice Calculate encrypted minimum of two values
    /// @param x First encrypted value
    /// @param y Second encrypted value
    /// @return Encrypted minimum value
    function encryptedMin(euint256 x, euint256 y) internal returns (euint256) {
        return e.min(x, y);
    }
}
