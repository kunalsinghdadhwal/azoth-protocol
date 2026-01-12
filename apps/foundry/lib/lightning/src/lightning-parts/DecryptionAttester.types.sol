// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title DecryptionAttestation Types
/// @notice Types for attested decryption in Inco Lightning

struct DecryptionAttestation {
    bytes32 handle;      // The encrypted handle that was decrypted
    uint256 result;      // The decrypted plaintext value
    uint256 timestamp;   // When the attestation was created
    address requester;   // Who requested the decryption
}
