// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {inco, e, ebool, euint256} from "@inco/lightning/src/Lib.sol";
import {ShadowSwapERC20} from "./ShadowSwapERC20.sol";
import {IShadowSwapPair} from "./interfaces/IShadowSwapPair.sol";
import {IShadowSwapFactory} from "./interfaces/IShadowSwapFactory.sol";
import {IShadowSwapCallee} from "./interfaces/IShadowSwapCallee.sol";
import {IConfidentialERC20} from "./interfaces/IConfidentialERC20.sol";
import {Math} from "./libraries/Math.sol";

/// @title ShadowSwapPair
/// @notice Confidential AMM pair with encrypted reserves following Uniswap V2 pattern
/// @dev All reserves, balances, and amounts are encrypted using Inco's FHE
contract ShadowSwapPair is IShadowSwapPair, ShadowSwapERC20 {
    // Constants
    uint256 public constant MINIMUM_LIQUIDITY = 10 ** 3;

    // Immutables (set on initialize)
    address public factory;
    address public token0;
    address public token1;

    // Encrypted reserves
    euint256 private reserve0;
    euint256 private reserve1;
    uint32 private blockTimestampLast;

    // Encrypted price accumulators for TWAP
    euint256 public price0CumulativeLast;
    euint256 public price1CumulativeLast;
    euint256 public kLast; // reserve0 * reserve1, for protocol fee

    // Reentrancy guard
    uint256 private unlocked = 1;

    modifier lock() {
        require(unlocked == 1, "ShadowSwap: LOCKED");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    // Errors
    error Forbidden();
    error InsufficientLiquidityMinted();
    error InsufficientLiquidityBurned();
    error InsufficientOutputAmount();
    error InsufficientLiquidity();
    error InsufficientInputAmount();
    error InvalidK();
    error InvalidTo();

    constructor() ShadowSwapERC20() {
        factory = msg.sender;
    }

    // ============ Initialize ============

    /// @inheritdoc IShadowSwapPair
    function initialize(address _token0, address _token1) external override {
        if (msg.sender != factory) revert Forbidden();
        token0 = _token0;
        token1 = _token1;

        // Initialize encrypted reserves to 0
        reserve0 = e.asEuint256(0);
        reserve1 = e.asEuint256(0);
        e.allow(reserve0, address(this));
        e.allow(reserve1, address(this));
    }

    // ============ View Functions ============

    /// @inheritdoc IShadowSwapPair
    function getReserves()
        public
        view
        override
        returns (euint256 _reserve0, euint256 _reserve1, uint32 _blockTimestampLast)
    {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    // ============ Mint (Add Liquidity) ============

    /// @inheritdoc IShadowSwapPair
    function mint(address to) external override lock returns (euint256 liquidity) {
        (euint256 _reserve0, euint256 _reserve1,) = getReserves();

        // Get current balances
        euint256 balance0 = IConfidentialERC20(token0).balanceOf(address(this));
        euint256 balance1 = IConfidentialERC20(token1).balanceOf(address(this));

        // Calculate amounts deposited
        euint256 amount0 = e.sub(balance0, _reserve0);
        euint256 amount1 = e.sub(balance1, _reserve1);

        // Mint protocol fee if enabled
        ebool feeOn = _mintFee(_reserve0, _reserve1);
        euint256 _totalSupply = _totalSupply;

        // Check if first deposit
        ebool isFirstDeposit = e.eq(_totalSupply, e.asEuint256(0));

        // First deposit: liquidity = sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY
        euint256 product = e.mul(amount0, amount1);
        euint256 sqrtProduct = Math.encryptedSqrt(product);
        euint256 firstLiquidity = e.sub(sqrtProduct, e.asEuint256(MINIMUM_LIQUIDITY));

        // Burn MINIMUM_LIQUIDITY to address(1) on first deposit
        euint256 minLiqEncrypted = e.asEuint256(MINIMUM_LIQUIDITY);
        euint256 burnAmount = e.select(isFirstDeposit, minLiqEncrypted, e.asEuint256(0));
        if (euint256.unwrap(burnAmount) != bytes32(0)) {
            _mint(address(1), burnAmount);
        }

        // Subsequent deposits: liquidity = min((amount0 * totalSupply / reserve0), (amount1 * totalSupply / reserve1))
        euint256 liq0 = e.div(e.mul(amount0, _totalSupply), _reserve0);
        euint256 liq1 = e.div(e.mul(amount1, _totalSupply), _reserve1);
        euint256 subsequentLiquidity = Math.encryptedMin(liq0, liq1);

        // Select based on first deposit or not
        liquidity = e.select(isFirstDeposit, firstLiquidity, subsequentLiquidity);

        // Require liquidity > 0
        ebool hasLiquidity = e.gt(liquidity, e.asEuint256(0));
        require(euint256.unwrap(e.select(hasLiquidity, e.asEuint256(1), e.asEuint256(0))) != bytes32(0), "ShadowSwap: INSUFFICIENT_LIQUIDITY_MINTED");

        _mint(to, liquidity);
        _update(balance0, balance1, _reserve0, _reserve1);

        // Update kLast if fees enabled
        if (euint256.unwrap(e.select(feeOn, e.asEuint256(1), e.asEuint256(0))) != bytes32(0)) {
            kLast = e.mul(reserve0, reserve1);
            e.allow(kLast, address(this));
        }

        emit Mint(msg.sender, amount0, amount1);
    }

    // ============ Burn (Remove Liquidity) ============

    /// @inheritdoc IShadowSwapPair
    function burn(address to) external override lock returns (euint256 amount0, euint256 amount1) {
        (euint256 _reserve0, euint256 _reserve1,) = getReserves();
        address _token0 = token0;
        address _token1 = token1;

        euint256 balance0 = IConfidentialERC20(_token0).balanceOf(address(this));
        euint256 balance1 = IConfidentialERC20(_token1).balanceOf(address(this));
        euint256 liquidity = _balances[address(this)]; // LP tokens sent to pair

        ebool feeOn = _mintFee(_reserve0, _reserve1);
        euint256 _totalSupplyVal = _totalSupply;

        // Pro-rata share: amount = liquidity * balance / totalSupply
        amount0 = e.div(e.mul(liquidity, balance0), _totalSupplyVal);
        amount1 = e.div(e.mul(liquidity, balance1), _totalSupplyVal);

        // Verify amounts > 0
        ebool hasAmount0 = e.gt(amount0, e.asEuint256(0));
        ebool hasAmount1 = e.gt(amount1, e.asEuint256(0));
        ebool hasBothAmounts = e.select(hasAmount0, hasAmount1, e.asEbool(false));
        require(euint256.unwrap(e.select(hasBothAmounts, e.asEuint256(1), e.asEuint256(0))) != bytes32(0), "ShadowSwap: INSUFFICIENT_LIQUIDITY_BURNED");

        _burn(address(this), liquidity);

        // Transfer tokens to recipient
        IConfidentialERC20(_token0).transfer(to, amount0);
        IConfidentialERC20(_token1).transfer(to, amount1);

        balance0 = IConfidentialERC20(_token0).balanceOf(address(this));
        balance1 = IConfidentialERC20(_token1).balanceOf(address(this));

        _update(balance0, balance1, _reserve0, _reserve1);

        if (euint256.unwrap(e.select(feeOn, e.asEuint256(1), e.asEuint256(0))) != bytes32(0)) {
            kLast = e.mul(reserve0, reserve1);
            e.allow(kLast, address(this));
        }

        emit Burn(msg.sender, amount0, amount1, to);
    }

    // ============ Swap ============

    /// @inheritdoc IShadowSwapPair
    function swap(
        bytes calldata encAmount0Out,
        bytes calldata encAmount1Out,
        address to,
        bytes calldata data
    ) external payable override lock {
        euint256 amount0Out = e.newEuint256(encAmount0Out, msg.sender);
        euint256 amount1Out = e.newEuint256(encAmount1Out, msg.sender);

        e.allow(amount0Out, address(this));
        e.allow(amount1Out, address(this));

        // At least one output must be > 0
        ebool has0Out = e.gt(amount0Out, e.asEuint256(0));
        ebool has1Out = e.gt(amount1Out, e.asEuint256(0));
        ebool hasOutput = e.select(has0Out, e.asEbool(true), has1Out);
        require(euint256.unwrap(e.select(hasOutput, e.asEuint256(1), e.asEuint256(0))) != bytes32(0), "ShadowSwap: INSUFFICIENT_OUTPUT_AMOUNT");

        (euint256 _reserve0, euint256 _reserve1,) = getReserves();

        // Output must be less than reserves
        ebool validOut0 = e.lt(amount0Out, _reserve0);
        ebool validOut1 = e.lt(amount1Out, _reserve1);
        ebool validOuts = e.select(validOut0, validOut1, e.asEbool(false));
        require(euint256.unwrap(e.select(validOuts, e.asEuint256(1), e.asEuint256(0))) != bytes32(0), "ShadowSwap: INSUFFICIENT_LIQUIDITY");

        if (to == token0 || to == token1) revert InvalidTo();

        // Optimistic transfer
        if (euint256.unwrap(e.select(has0Out, e.asEuint256(1), e.asEuint256(0))) != bytes32(0)) {
            IConfidentialERC20(token0).transfer(to, amount0Out);
        }
        if (euint256.unwrap(e.select(has1Out, e.asEuint256(1), e.asEuint256(0))) != bytes32(0)) {
            IConfidentialERC20(token1).transfer(to, amount1Out);
        }

        // Flash loan callback
        if (data.length > 0) {
            IShadowSwapCallee(to).shadowSwapCall(msg.sender, amount0Out, amount1Out, data);
        }

        euint256 balance0 = IConfidentialERC20(token0).balanceOf(address(this));
        euint256 balance1 = IConfidentialERC20(token1).balanceOf(address(this));

        // Calculate input amounts
        euint256 reserve0MinusOut = e.sub(_reserve0, amount0Out);
        euint256 reserve1MinusOut = e.sub(_reserve1, amount1Out);

        ebool balance0GtReserve = e.gt(balance0, reserve0MinusOut);
        ebool balance1GtReserve = e.gt(balance1, reserve1MinusOut);

        euint256 amount0In = e.select(
            balance0GtReserve,
            e.sub(balance0, reserve0MinusOut),
            e.asEuint256(0)
        );
        euint256 amount1In = e.select(
            balance1GtReserve,
            e.sub(balance1, reserve1MinusOut),
            e.asEuint256(0)
        );

        // Require at least one input
        ebool has0In = e.gt(amount0In, e.asEuint256(0));
        ebool has1In = e.gt(amount1In, e.asEuint256(0));
        ebool hasInput = e.select(has0In, e.asEbool(true), has1In);
        require(euint256.unwrap(e.select(hasInput, e.asEuint256(1), e.asEuint256(0))) != bytes32(0), "ShadowSwap: INSUFFICIENT_INPUT_AMOUNT");

        // Verify k invariant with 0.3% fee
        // balance0Adjusted * balance1Adjusted >= reserve0 * reserve1 * 1000^2
        euint256 balance0Adjusted = e.sub(
            e.mul(balance0, e.asEuint256(1000)),
            e.mul(amount0In, e.asEuint256(3))
        );
        euint256 balance1Adjusted = e.sub(
            e.mul(balance1, e.asEuint256(1000)),
            e.mul(amount1In, e.asEuint256(3))
        );

        euint256 leftSide = e.mul(balance0Adjusted, balance1Adjusted);
        euint256 rightSide = e.mul(e.mul(_reserve0, _reserve1), e.asEuint256(1000000));

        ebool kValid = e.ge(leftSide, rightSide);
        require(euint256.unwrap(e.select(kValid, e.asEuint256(1), e.asEuint256(0))) != bytes32(0), "ShadowSwap: K");

        _update(balance0, balance1, _reserve0, _reserve1);

        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    // ============ Sync & Skim ============

    /// @inheritdoc IShadowSwapPair
    function sync() external override lock {
        _update(
            IConfidentialERC20(token0).balanceOf(address(this)),
            IConfidentialERC20(token1).balanceOf(address(this)),
            reserve0,
            reserve1
        );
    }

    /// @inheritdoc IShadowSwapPair
    function skim(address to) external override lock {
        address _token0 = token0;
        address _token1 = token1;

        euint256 excess0 = e.sub(IConfidentialERC20(_token0).balanceOf(address(this)), reserve0);
        euint256 excess1 = e.sub(IConfidentialERC20(_token1).balanceOf(address(this)), reserve1);

        IConfidentialERC20(_token0).transfer(to, excess0);
        IConfidentialERC20(_token1).transfer(to, excess1);
    }

    // ============ Internal Functions ============

    /// @notice Update reserves and price accumulators
    function _update(
        euint256 balance0,
        euint256 balance1,
        euint256 _reserve0,
        euint256 _reserve1
    ) private {
        uint32 blockTimestamp = uint32(block.timestamp % 2 ** 32);
        uint32 timeElapsed = blockTimestamp - blockTimestampLast;

        // Update price accumulators if time has elapsed and reserves are non-zero
        if (timeElapsed > 0 && euint256.unwrap(_reserve0) != bytes32(0) && euint256.unwrap(_reserve1) != bytes32(0)) {
            // price0 = reserve1 / reserve0
            // price1 = reserve0 / reserve1
            euint256 price0 = e.div(_reserve1, _reserve0);
            euint256 price1 = e.div(_reserve0, _reserve1);

            price0CumulativeLast = e.add(
                price0CumulativeLast,
                e.mul(price0, e.asEuint256(timeElapsed))
            );
            price1CumulativeLast = e.add(
                price1CumulativeLast,
                e.mul(price1, e.asEuint256(timeElapsed))
            );

            e.allow(price0CumulativeLast, address(this));
            e.allow(price1CumulativeLast, address(this));
        }

        reserve0 = balance0;
        reserve1 = balance1;
        e.allow(reserve0, address(this));
        e.allow(reserve1, address(this));

        blockTimestampLast = blockTimestamp;

        emit Sync(reserve0, reserve1);
    }

    /// @notice Mint protocol fee (1/6 of 0.3% = 0.05%)
    function _mintFee(euint256 _reserve0, euint256 _reserve1) private returns (ebool feeOn) {
        address feeTo = IShadowSwapFactory(factory).feeTo();
        feeOn = e.asEbool(feeTo != address(0));

        euint256 _kLast = kLast;

        if (feeTo != address(0) && euint256.unwrap(_kLast) != bytes32(0)) {
            euint256 rootK = Math.encryptedSqrt(e.mul(_reserve0, _reserve1));
            euint256 rootKLast = Math.encryptedSqrt(_kLast);

            ebool shouldMintFee = e.gt(rootK, rootKLast);

            euint256 numerator = e.mul(_totalSupply, e.sub(rootK, rootKLast));
            euint256 denominator = e.add(e.mul(rootK, e.asEuint256(5)), rootKLast);
            euint256 liquidity = e.div(numerator, denominator);

            liquidity = e.select(shouldMintFee, liquidity, e.asEuint256(0));

            ebool hasLiquidity = e.gt(liquidity, e.asEuint256(0));
            if (euint256.unwrap(e.select(hasLiquidity, e.asEuint256(1), e.asEuint256(0))) != bytes32(0)) {
                _mint(feeTo, liquidity);
            }
        }
    }
}
