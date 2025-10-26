# Deploy Test PYUSD Token on Sepolia

## Quick Deploy Steps

### 1. Get Sepolia ETH (for gas fees)
- Go to: https://sepoliafaucet.com/
- Or: https://www.alchemy.com/faucets/ethereum-sepolia
- Connect your wallet and request test ETH

### 2. Deploy TestPYUSD Contract

**Option A: Using Remix (Easiest)**
1. Go to https://remix.ethereum.org/
2. Click "Create New File" → name it `TestPYUSD.sol`
3. Copy the entire content from `TestPYUSD.sol` in this folder
4. Click "Solidity Compiler" tab → Click "Compile TestPYUSD.sol"
5. Click "Deploy & Run Transactions" tab
6. Change "Environment" to "Injected Provider - MetaMask"
7. Make sure MetaMask is on Sepolia network
8. Click "Deploy"
9. Confirm transaction in MetaMask
10. **Copy the deployed contract address**

**Option B: Using Hardhat**
```bash
# Install Hardhat
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Initialize Hardhat
npx hardhat init

# Copy TestPYUSD.sol to contracts/
# Deploy
npx hardhat run scripts/deploy.js --network sepolia
```

### 3. Update .env File
Replace the contract address in `.env`:
```
VITE_PYUSD_CONTRACT_ADDRESS=<YOUR_DEPLOYED_CONTRACT_ADDRESS>
```

### 4. Get Test Tokens
After deploying, you can mint tokens in two ways:

**Option A: Using Remix**
1. In Remix, under "Deployed Contracts"
2. Click on your TestPYUSD contract
3. Click "faucet" button → Click "transact"
4. This gives you 100 test PYUSD

**Option B: Using Etherscan**
1. Go to https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
2. Click "Contract" → "Write Contract"
3. Connect wallet
4. Call `faucet()` function

### 5. Verify Your Setup
1. Restart your dev server: `npm run dev`
2. Login to your app
3. Check browser console for logs:
   - "✅ PYUSD Contract Info" should show your contract details
   - "💰 PYUSD Balance" should show your balance
4. Go to Transactions page and click refresh icon
5. You should see your transactions!

## Troubleshooting

### Balance shows 0 even after minting
- Check you're minting to the same wallet address shown in your app
- View your wallet address in app: Dashboard → Wallet Overview
- Compare with wallet in MetaMask

### Contract verification failed
- Make sure the contract address in .env is correct
- Check the contract exists: https://sepolia.etherscan.io/address/YOUR_ADDRESS
- Try restarting the dev server

### No transactions showing
- Make sure you've made at least one transfer/mint
- Check the transaction was confirmed on Sepolia
- Click the refresh button on Transactions page
- Check browser console for error messages

## Important Notes

⚠️ **This is a TEST token on TESTNET only!**
- Zero real value
- Only for testing your app
- Don't use on mainnet

📝 **Contract Features:**
- Name: "Test PYUSD"
- Symbol: "PYUSD"  
- Decimals: 6 (same as real PYUSD)
- Anyone can mint tokens using `faucet()` or `mint(amount)`
- Fully ERC20 compatible
