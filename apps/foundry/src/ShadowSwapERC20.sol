// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {inco, e, ebool, euint256} from "@inco/lightning/src/Lib.sol";
import {IShadowSwapERC20} from "./interfaces/IShadowSwapERC20.sol";

/// @title ShadowSwapERC20
/// @notice LP token with encrypted balances following Uniswap V2 pattern
/// @dev Includes EIP-2612 permit functionality
contract ShadowSwapERC20 is IShadowSwapERC20 {
    // Token metadata
    string public constant name = "ShadowSwap LP";
    string public constant symbol = "SHADOW-LP";
    uint8 public constant decimals = 18;

    // Encrypted state
    euint256 internal _totalSupply;
    mapping(address => euint256) internal _balances;
    mapping(address => mapping(address => euint256)) internal _allowances;

    // EIP-712 / EIP-2612
    bytes32 public DOMAIN_SEPARATOR;
    bytes32 public constant PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    mapping(address => uint256) public nonces;

    // Errors
    error InsufficientFees();
    error Expired();
    error InvalidSignature();

    constructor() {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name)),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );
    }

    // ============ View Functions ============

    /// @inheritdoc IShadowSwapERC20
    function totalSupply() external view override returns (euint256) {
        return _totalSupply;
    }

    /// @inheritdoc IShadowSwapERC20
    function balanceOf(address owner) external view override returns (euint256) {
        return _balances[owner];
    }

    /// @inheritdoc IShadowSwapERC20
    function allowance(address owner, address spender) external view override returns (euint256) {
        return _allowances[owner][spender];
    }

    // ============ Internal Helpers ============

    function _requireFee() internal view {
        if (msg.value < inco.getFee()) revert InsufficientFees();
    }

    // ============ Mint/Burn (Internal) ============

    /// @notice Mint LP tokens
    function _mint(address to, euint256 value) internal {
        if (euint256.unwrap(_balances[to]) == bytes32(0)) {
            _balances[to] = value;
        } else {
            _balances[to] = e.add(_balances[to], value);
        }
        e.allow(_balances[to], address(this));
        e.allow(_balances[to], to);

        _totalSupply = e.add(_totalSupply, value);
        e.allow(_totalSupply, address(this));

        emit Transfer(address(0), to, value);
    }

    /// @notice Burn LP tokens
    function _burn(address from, euint256 value) internal {
        _balances[from] = e.sub(_balances[from], value);
        e.allow(_balances[from], address(this));
        e.allow(_balances[from], from);

        _totalSupply = e.sub(_totalSupply, value);
        e.allow(_totalSupply, address(this));

        emit Transfer(from, address(0), value);
    }

    // ============ Approval Functions ============

    /// @inheritdoc IShadowSwapERC20
    function approve(address spender, bytes calldata encValue) external payable override returns (bool) {
        _requireFee();
        return approve(spender, e.newEuint256(encValue, msg.sender));
    }

    /// @inheritdoc IShadowSwapERC20
    function approve(address spender, euint256 value) public override returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }

    function _approve(address owner, address spender, euint256 value) internal {
        _allowances[owner][spender] = value;
        e.allow(value, address(this));
        e.allow(value, owner);
        e.allow(value, spender);
        emit Approval(owner, spender, value);
    }

    // ============ Transfer Functions ============

    /// @inheritdoc IShadowSwapERC20
    function transfer(address to, bytes calldata encValue) external payable override returns (bool) {
        _requireFee();
        return transfer(to, e.newEuint256(encValue, msg.sender));
    }

    /// @inheritdoc IShadowSwapERC20
    function transfer(address to, euint256 value) public override returns (bool) {
        e.allow(value, address(this));
        ebool canTransfer = e.ge(_balances[msg.sender], value);
        _transfer(msg.sender, to, value, canTransfer);
        return true;
    }

    /// @inheritdoc IShadowSwapERC20
    function transferFrom(address from, address to, bytes calldata encValue) external payable override returns (bool) {
        _requireFee();
        return transferFrom(from, to, e.newEuint256(encValue, msg.sender));
    }

    /// @inheritdoc IShadowSwapERC20
    function transferFrom(address from, address to, euint256 value) public override returns (bool) {
        e.allow(value, address(this));
        ebool isTransferable = _updateAllowance(from, msg.sender, value);
        _transfer(from, to, value, isTransferable);
        return true;
    }

    function _updateAllowance(address owner, address spender, euint256 value) internal returns (ebool) {
        euint256 currentAllowance = _allowances[owner][spender];
        ebool allowedTransfer = e.ge(currentAllowance, value);
        ebool canTransfer = e.ge(_balances[owner], value);
        ebool isTransferable = e.select(canTransfer, allowedTransfer, e.asEbool(false));

        _approve(owner, spender, e.select(isTransferable, e.sub(currentAllowance, value), currentAllowance));
        return isTransferable;
    }

    function _transfer(address from, address to, euint256 value, ebool isTransferable) internal {
        euint256 transferValue = e.select(isTransferable, value, e.asEuint256(0));

        // Update recipient
        if (euint256.unwrap(_balances[to]) == bytes32(0)) {
            _balances[to] = transferValue;
        } else {
            _balances[to] = e.add(_balances[to], transferValue);
        }
        e.allow(_balances[to], address(this));
        e.allow(_balances[to], to);

        // Update sender
        _balances[from] = e.sub(_balances[from], transferValue);
        e.allow(_balances[from], address(this));
        e.allow(_balances[from], from);

        emit Transfer(from, to, transferValue);
    }

    // ============ Permit (EIP-2612) ============

    /// @inheritdoc IShadowSwapERC20
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override {
        if (deadline < block.timestamp) revert Expired();

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonces[owner]++, deadline))
            )
        );

        address recoveredAddress = ecrecover(digest, v, r, s);
        if (recoveredAddress == address(0) || recoveredAddress != owner) revert InvalidSignature();

        // Convert plaintext value to encrypted for internal approval
        euint256 encValue = e.asEuint256(value);
        _approve(owner, spender, encValue);
    }
}
