// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {ShadowSwapFactory} from "../src/ShadowSwapFactory.sol";
import {ConfidentialERC20} from "../src/ConfidentialERC20.sol";

/// @title DeployShadowSwap
/// @notice Deployment script for ShadowSwap protocol on Base Sepolia
contract DeployShadowSwap is Script {
    // Base Sepolia Chainlink Oracles (for reference)
    address constant ETH_USD_ORACLE = 0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1;
    address constant LINK_USD_ORACLE = 0xb113F5A928BCfF189C998ab20d753a47F9dE5A61;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying ShadowSwap with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Factory
        ShadowSwapFactory factory = new ShadowSwapFactory(deployer);
        console.log("ShadowSwapFactory deployed at:", address(factory));

        // 2. Deploy example ConfidentialERC20 tokens
        ConfidentialERC20 cUSDC = new ConfidentialERC20("Confidential USDC", "cUSDC");
        ConfidentialERC20 cETH = new ConfidentialERC20("Confidential ETH", "cETH");
        console.log("cUSDC deployed at:", address(cUSDC));
        console.log("cETH deployed at:", address(cETH));

        // 3. Create first pair via factory
        address pair = factory.createPair(address(cUSDC), address(cETH));
        console.log("cUSDC/cETH pair created at:", pair);

        // 4. Mint initial tokens to deployer for testing
        cUSDC.mint(1_000_000 * 10 ** 18); // 1M cUSDC
        cETH.mint(1_000 * 10 ** 18); // 1K cETH
        console.log("Minted 1M cUSDC and 1K cETH to deployer");

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n========================================");
        console.log("       SHADOWSWAP DEPLOYMENT SUMMARY     ");
        console.log("========================================");
        console.log("Network: Base Sepolia");
        console.log("----------------------------------------");
        console.log("Factory:     ", address(factory));
        console.log("cUSDC:       ", address(cUSDC));
        console.log("cETH:        ", address(cETH));
        console.log("Pair:        ", pair);
        console.log("----------------------------------------");
        console.log("Fee Setter:  ", deployer);
        console.log("========================================");
    }
}

/// @title DeployTokensOnly
/// @notice Deploy only tokens for testing
contract DeployTokensOnly is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        ConfidentialERC20 tokenA = new ConfidentialERC20("Token A", "TKA");
        ConfidentialERC20 tokenB = new ConfidentialERC20("Token B", "TKB");

        console.log("Token A:", address(tokenA));
        console.log("Token B:", address(tokenB));

        vm.stopBroadcast();
    }
}

/// @title CreatePair
/// @notice Create a new pair on existing factory
contract CreatePair is Script {
    function run(address factory, address tokenA, address tokenB) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        address pair = ShadowSwapFactory(factory).createPair(tokenA, tokenB);
        console.log("New pair created at:", pair);

        vm.stopBroadcast();
    }
}
