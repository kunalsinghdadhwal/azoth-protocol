// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {inco, e, ebool, euint256} from "@inco/lightning/src/Lib.sol";
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IConfidentialERC20} from "./interfaces/IConfidentialERC20.sol";

/// @title ConfidentialERC20
/// @notice ERC20 token with encrypted balances using Inco's FHE
/// @dev Based on Inco's confidential token tutorial
contract ConfidentialERC20 is IConfidentialERC20, Ownable2Step {
    // Token metadata
    string private _name;
    string private _symbol;
    uint8 public constant decimals = 18;

    // Encrypted state
    euint256 private _totalSupply;
    mapping(address => euint256) private _balances;
    mapping(address => mapping(address => euint256)) private _allowances;

    /// @notice Constructor
    /// @param tokenName Token name
    /// @param tokenSymbol Token symbol
    constructor(string memory tokenName, string memory tokenSymbol) Ownable(msg.sender) {
        _name = tokenName;
        _symbol = tokenSymbol;
    }

    // ============ View Functions ============

    /// @inheritdoc IConfidentialERC20
    function name() external view override returns (string memory) {
        return _name;
    }

    /// @inheritdoc IConfidentialERC20
    function symbol() external view override returns (string memory) {
        return _symbol;
    }

    /// @inheritdoc IConfidentialERC20
    function totalSupply() external view override returns (euint256) {
        return _totalSupply;
    }

    /// @inheritdoc IConfidentialERC20
    function balanceOf(address account) external view override returns (euint256) {
        return _balances[account];
    }

    /// @inheritdoc IConfidentialERC20
    function allowance(address owner, address spender) external view override returns (euint256) {
        return _allowances[owner][spender];
    }

    // ============ Internal Helpers ============

    /// @notice Require sufficient FHE operation fee
    function _requireFee() internal view {
        if (msg.value < inco.getFee()) revert InsufficientFees();
    }

    // ============ Mint Functions ============

    /// @inheritdoc IConfidentialERC20
    function mint(uint256 amount) external override onlyOwner {
        euint256 encAmount = e.asEuint256(amount);

        if (euint256.unwrap(_balances[owner()]) == bytes32(0)) {
            _balances[owner()] = encAmount;
        } else {
            _balances[owner()] = e.add(_balances[owner()], encAmount);
        }

        e.allow(_balances[owner()], address(this));
        e.allow(_balances[owner()], owner());

        _totalSupply = e.add(_totalSupply, encAmount);
        e.allow(_totalSupply, address(this));
        e.reveal(_totalSupply);

        emit Mint(owner(), amount);
    }

    /// @inheritdoc IConfidentialERC20
    function encryptedMint(bytes calldata encryptedAmount) external payable override {
        _requireFee();
        euint256 amount = e.newEuint256(encryptedAmount, msg.sender);
        e.allow(amount, address(this));

        if (euint256.unwrap(_balances[msg.sender]) == bytes32(0)) {
            _balances[msg.sender] = amount;
        } else {
            _balances[msg.sender] = e.add(_balances[msg.sender], amount);
        }

        e.allow(_balances[msg.sender], address(this));
        e.allow(_balances[msg.sender], owner());
        e.allow(_balances[msg.sender], msg.sender);

        _totalSupply = e.add(_totalSupply, amount);
        e.allow(_totalSupply, address(this));
        e.reveal(_totalSupply);

        emit EncryptedMint(msg.sender, amount);
    }

    // ============ Transfer Functions ============

    /// @inheritdoc IConfidentialERC20
    function transfer(address to, bytes calldata encryptedAmount) external payable override returns (bool) {
        _requireFee();
        return transfer(to, e.newEuint256(encryptedAmount, msg.sender));
    }

    /// @inheritdoc IConfidentialERC20
    function transfer(address to, euint256 amount) public override returns (bool) {
        e.allow(amount, address(this));
        ebool canTransfer = e.ge(_balances[msg.sender], amount);
        _transfer(msg.sender, to, amount, canTransfer);
        return true;
    }

    // ============ Approval Functions ============

    /// @inheritdoc IConfidentialERC20
    function approve(address spender, bytes calldata encryptedAmount) external payable override returns (bool) {
        _requireFee();
        return approve(spender, e.newEuint256(encryptedAmount, msg.sender));
    }

    /// @inheritdoc IConfidentialERC20
    function approve(address spender, euint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /// @notice Internal approve function
    function _approve(address owner, address spender, euint256 amount) internal {
        _allowances[owner][spender] = amount;
        e.allow(amount, address(this));
        e.allow(amount, owner);
        e.allow(amount, spender);
    }

    // ============ TransferFrom Functions ============

    /// @inheritdoc IConfidentialERC20
    function transferFrom(address from, address to, bytes calldata encryptedAmount)
        external
        payable
        override
        returns (bool)
    {
        _requireFee();
        return transferFrom(from, to, e.newEuint256(encryptedAmount, msg.sender));
    }

    /// @inheritdoc IConfidentialERC20
    function transferFrom(address from, address to, euint256 amount) public override returns (bool) {
        e.allow(amount, address(this));
        ebool isTransferable = _updateAllowance(from, msg.sender, amount);
        _transfer(from, to, amount, isTransferable);
        return true;
    }

    /// @notice Update allowance after transferFrom
    function _updateAllowance(address owner, address spender, euint256 amount) internal returns (ebool) {
        euint256 currentAllowance = _allowances[owner][spender];
        ebool allowedTransfer = e.ge(currentAllowance, amount);
        ebool canTransfer = e.ge(_balances[owner], amount);
        ebool isTransferable = e.select(canTransfer, allowedTransfer, e.asEbool(false));

        _approve(owner, spender, e.select(isTransferable, e.sub(currentAllowance, amount), currentAllowance));
        return isTransferable;
    }

    // ============ Internal Transfer ============

    /// @notice Internal transfer function
    function _transfer(address from, address to, euint256 amount, ebool isTransferable) internal {
        euint256 transferValue = e.select(isTransferable, amount, e.asEuint256(0));

        // Update recipient balance
        if (euint256.unwrap(_balances[to]) == bytes32(0)) {
            _balances[to] = transferValue;
        } else {
            _balances[to] = e.add(_balances[to], transferValue);
        }
        e.allow(_balances[to], address(this));
        e.allow(_balances[to], to);

        // Update sender balance
        _balances[from] = e.sub(_balances[from], transferValue);
        e.allow(_balances[from], address(this));
        e.allow(_balances[from], from);

        emit Transfer(from, to, transferValue);
    }
}
