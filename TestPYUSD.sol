// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Simple Test PYUSD Token for Sepolia Testnet
 * 
 * Deploy this contract on Sepolia and use the deployed address in your .env file
 * 
 * To deploy using Remix:
 * 1. Go to https://remix.ethereum.org/
 * 2. Create new file: TestPYUSD.sol
 * 3. Paste this code
 * 4. Compile with Solidity 0.8.20+
 * 5. Deploy to Sepolia network via MetaMask
 * 6. Copy deployed contract address to .env as VITE_PYUSD_CONTRACT_ADDRESS
 * 7. Call mint() to get yourself some test tokens
 */

contract TestPYUSD {
    string public name = "Test PYUSD";
    string public symbol = "PYUSD";
    uint8 public decimals = 6; // PYUSD uses 6 decimals
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        // Mint initial supply to deployer
        _mint(msg.sender, 1000000 * 10**decimals); // 1 million test PYUSD
    }
    
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        
        emit Transfer(from, to, value);
        return true;
    }
    
    function _mint(address to, uint256 value) internal {
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }
    
    // Public mint function for testing - anyone can mint tokens
    function mint(uint256 amount) public {
        _mint(msg.sender, amount);
    }
    
    // Faucet function - get 100 test PYUSD
    function faucet() public {
        _mint(msg.sender, 100 * 10**decimals);
    }
}
