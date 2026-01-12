// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title MockFHE
/// @notice Mock library that simulates FHE operations with plaintext for local testing
/// @dev In production, these would be encrypted operations via Inco's FHE

// Mock encrypted types (just wrappers around uint256/bool for testing)
type euint256 is uint256;
type ebool is bool;
type eaddress is address;

/// @notice Mock 'e' library simulating Inco's FHE operations
library MockE {
    // ============ Type Conversion ============

    function asEuint256(uint256 val) internal pure returns (euint256) {
        return euint256.wrap(val);
    }

    function asEbool(bool val) internal pure returns (ebool) {
        return ebool.wrap(val);
    }

    function asEaddress(address val) internal pure returns (eaddress) {
        return eaddress.wrap(val);
    }

    // ============ Arithmetic Operations ============

    function add(euint256 a, euint256 b) internal pure returns (euint256) {
        return euint256.wrap(euint256.unwrap(a) + euint256.unwrap(b));
    }

    function sub(euint256 a, euint256 b) internal pure returns (euint256) {
        return euint256.wrap(euint256.unwrap(a) - euint256.unwrap(b));
    }

    function mul(euint256 a, euint256 b) internal pure returns (euint256) {
        return euint256.wrap(euint256.unwrap(a) * euint256.unwrap(b));
    }

    function div(euint256 a, euint256 b) internal pure returns (euint256) {
        require(euint256.unwrap(b) != 0, "MockFHE: division by zero");
        return euint256.wrap(euint256.unwrap(a) / euint256.unwrap(b));
    }

    function mod(euint256 a, euint256 b) internal pure returns (euint256) {
        require(euint256.unwrap(b) != 0, "MockFHE: modulo by zero");
        return euint256.wrap(euint256.unwrap(a) % euint256.unwrap(b));
    }

    // ============ Comparison Operations ============

    function gt(euint256 a, euint256 b) internal pure returns (ebool) {
        return ebool.wrap(euint256.unwrap(a) > euint256.unwrap(b));
    }

    function ge(euint256 a, euint256 b) internal pure returns (ebool) {
        return ebool.wrap(euint256.unwrap(a) >= euint256.unwrap(b));
    }

    function lt(euint256 a, euint256 b) internal pure returns (ebool) {
        return ebool.wrap(euint256.unwrap(a) < euint256.unwrap(b));
    }

    function le(euint256 a, euint256 b) internal pure returns (ebool) {
        return ebool.wrap(euint256.unwrap(a) <= euint256.unwrap(b));
    }

    function eq(euint256 a, euint256 b) internal pure returns (ebool) {
        return ebool.wrap(euint256.unwrap(a) == euint256.unwrap(b));
    }

    function ne(euint256 a, euint256 b) internal pure returns (ebool) {
        return ebool.wrap(euint256.unwrap(a) != euint256.unwrap(b));
    }

    // ============ Min/Max ============

    function min(euint256 a, euint256 b) internal pure returns (euint256) {
        return euint256.unwrap(a) < euint256.unwrap(b) ? a : b;
    }

    function max(euint256 a, euint256 b) internal pure returns (euint256) {
        return euint256.unwrap(a) > euint256.unwrap(b) ? a : b;
    }

    // ============ Conditional Selection ============

    function select(ebool condition, euint256 a, euint256 b) internal pure returns (euint256) {
        return ebool.unwrap(condition) ? a : b;
    }

    function select(ebool condition, ebool a, ebool b) internal pure returns (ebool) {
        return ebool.unwrap(condition) ? a : b;
    }

    // ============ Boolean Operations ============

    function and(ebool a, ebool b) internal pure returns (ebool) {
        return ebool.wrap(ebool.unwrap(a) && ebool.unwrap(b));
    }

    function or(ebool a, ebool b) internal pure returns (ebool) {
        return ebool.wrap(ebool.unwrap(a) || ebool.unwrap(b));
    }

    function not(ebool a) internal pure returns (ebool) {
        return ebool.wrap(!ebool.unwrap(a));
    }

    // ============ Bitwise Operations ============

    function xor(euint256 a, euint256 b) internal pure returns (euint256) {
        return euint256.wrap(euint256.unwrap(a) ^ euint256.unwrap(b));
    }

    function bitwiseAnd(euint256 a, euint256 b) internal pure returns (euint256) {
        return euint256.wrap(euint256.unwrap(a) & euint256.unwrap(b));
    }

    function bitwiseOr(euint256 a, euint256 b) internal pure returns (euint256) {
        return euint256.wrap(euint256.unwrap(a) | euint256.unwrap(b));
    }

    // ============ Random ============

    function rand() internal view returns (euint256) {
        return euint256.wrap(uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao))));
    }

    function randBounded(uint256 upperBound) internal view returns (euint256) {
        return euint256.wrap(uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao))) % upperBound);
    }

    // ============ Create from encrypted input (mock - just decode) ============

    function newEuint256(bytes memory, address) internal pure returns (euint256) {
        // In testing, we just return 0 as we can't decode encrypted data
        return euint256.wrap(0);
    }

    function newEbool(bytes memory, address) internal pure returns (ebool) {
        return ebool.wrap(false);
    }

    // ============ Access Control (no-ops in mock) ============

    function allow(euint256, address) internal pure {}
    function allow(ebool, address) internal pure {}
    function allow(eaddress, address) internal pure {}
    function allowThis(euint256) internal pure {}
    function allowThis(ebool) internal pure {}

    // ============ Reveal (no-ops in mock) ============

    function reveal(euint256) internal pure {}
    function reveal(ebool) internal pure {}
    function reveal(eaddress) internal pure {}
}

/// @notice Mock inco object
library MockInco {
    function getFee() internal pure returns (uint256) {
        return 0; // No fees in mock
    }
}
