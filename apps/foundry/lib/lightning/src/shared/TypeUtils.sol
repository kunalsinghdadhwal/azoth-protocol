// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ebool} from "../Lib.sol";

/// @title TypeUtils
/// @notice Utility functions for Inco encrypted types

/// @notice Convert ebool to plain bool
/// @param value The encrypted boolean
/// @return The plain boolean value
function asBool(ebool value) pure returns (bool) {
    return ebool.unwrap(value) != bytes32(0);
}
