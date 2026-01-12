// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title MockConfidentialERC20
/// @notice Mock ERC20 with plaintext balances for local testing
/// @dev Simulates the ConfidentialERC20 interface without FHE
contract MockConfidentialERC20 is Ownable2Step {
    string private _name;
    string private _symbol;
    uint8 public constant decimals = 18;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);
    event Mint(address indexed to, uint256 amount);

    constructor(string memory tokenName, string memory tokenSymbol) Ownable(msg.sender) {
        _name = tokenName;
        _symbol = tokenSymbol;
    }

    // ============ View Functions ============

    function name() external view returns (string memory) {
        return _name;
    }

    function symbol() external view returns (string memory) {
        return _symbol;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    // ============ Mint ============

    function mint(uint256 amount) external onlyOwner {
        _balances[owner()] += amount;
        _totalSupply += amount;
        emit Mint(owner(), amount);
        emit Transfer(address(0), owner(), amount);
    }

    function mintTo(address to, uint256 amount) external onlyOwner {
        _balances[to] += amount;
        _totalSupply += amount;
        emit Mint(to, amount);
        emit Transfer(address(0), to, amount);
    }

    // ============ Transfer ============

    function transfer(address to, uint256 amount) external returns (bool) {
        require(_balances[msg.sender] >= amount, "MockERC20: insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    // ============ Approval ============

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    // ============ TransferFrom ============

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(_balances[from] >= amount, "MockERC20: insufficient balance");
        require(_allowances[from][msg.sender] >= amount, "MockERC20: insufficient allowance");

        _balances[from] -= amount;
        _balances[to] += amount;
        _allowances[from][msg.sender] -= amount;

        emit Transfer(from, to, amount);
        return true;
    }
}
