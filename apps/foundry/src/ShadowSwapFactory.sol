// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IShadowSwapFactory} from "./interfaces/IShadowSwapFactory.sol";
import {IShadowSwapPair} from "./interfaces/IShadowSwapPair.sol";
import {ShadowSwapPair} from "./ShadowSwapPair.sol";

/// @title ShadowSwapFactory
/// @notice Factory contract for creating ShadowSwap trading pairs
/// @dev Follows Uniswap V2 Factory pattern with CREATE2 deployment
contract ShadowSwapFactory is IShadowSwapFactory {
    // State
    address public feeTo;
    address public feeToSetter;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    // Errors
    error IdenticalAddresses();
    error ZeroAddress();
    error PairExists();
    error Forbidden();

    /// @notice Constructor
    /// @param _feeToSetter Initial fee setter address
    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    /// @inheritdoc IShadowSwapFactory
    function allPairsLength() external view override returns (uint256) {
        return allPairs.length;
    }

    /// @inheritdoc IShadowSwapFactory
    function createPair(address tokenA, address tokenB) external override returns (address pair) {
        if (tokenA == tokenB) revert IdenticalAddresses();

        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);

        if (token0 == address(0)) revert ZeroAddress();
        if (getPair[token0][token1] != address(0)) revert PairExists();

        // Deploy using CREATE2 for deterministic addresses
        bytes memory bytecode = type(ShadowSwapPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));

        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        // Initialize the pair
        IShadowSwapPair(pair).initialize(token0, token1);

        // Store pair in both directions
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    /// @inheritdoc IShadowSwapFactory
    function setFeeTo(address _feeTo) external override {
        if (msg.sender != feeToSetter) revert Forbidden();
        feeTo = _feeTo;
    }

    /// @inheritdoc IShadowSwapFactory
    function setFeeToSetter(address _feeToSetter) external override {
        if (msg.sender != feeToSetter) revert Forbidden();
        feeToSetter = _feeToSetter;
    }
}
