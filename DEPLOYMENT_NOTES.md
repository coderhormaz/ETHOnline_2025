# Deployment Notes - Ethereum Sepolia Network

## ✅ Completed Setup

### 1. Network Configuration
- **Network**: Ethereum Sepolia Testnet
- **Chain ID**: 11155111
- **RPC Provider**: Alchemy
- **Block Explorer**: https://sepolia.etherscan.io

### 2. Environment Variables (.env)
```
VITE_ARBITRUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/-HDdHEpej423HpkgwfeTHzFm0jgaBi_f
VITE_ARBITRUM_CHAIN_ID=11155111
VITE_NETWORK_NAME=Sepolia
VITE_BLOCK_EXPLORER_URL=https://sepolia.etherscan.io
VITE_PYUSD_CONTRACT_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
```

### 3. Implemented Features
- ✅ RPC endpoint with CORS support (Alchemy)
- ✅ Retry logic for balance fetching (3 attempts with exponential backoff)
- ✅ Improved error handling with user-friendly messages
- ✅ Contract verification function
- ✅ All Arbiscan links replaced with Sepolia Etherscan
- ✅ Network configuration using environment variables

## 🧪 Testing Checklist

### Test 1: Balance Fetching
1. Login to your account
2. Navigate to Dashboard
3. Check if PYUSD balance loads (should show 0 if no tokens)
4. Open browser console - should see "PYUSD Contract Info" log

### Test 2: Payment Links
1. Create a new payment link
2. Copy the external URL (e.g., http://localhost:5173/pay/xxx)
3. Open in incognito/new browser
4. Click "Connect Wallet"
5. Verify MetaMask prompts to switch to Sepolia network
6. Confirm network switch works

### Test 3: Transaction History
1. Navigate to Transactions page
2. Verify page loads without errors
3. Check if past transactions appear (if any exist in database)

### Test 4: Send/Receive
1. Try sending PYUSD (need testnet PYUSD tokens)
2. Check if transaction appears on Sepolia Etherscan
3. Verify QR code generation for receiving

## ⚠️ Important Notes

### PYUSD Contract Address
The contract address `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9` is configured for Sepolia.

**To verify this is the correct address:**
1. Check console logs when app loads - look for "PYUSD Contract Info"
2. Visit: https://sepolia.etherscan.io/address/0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
3. Confirm it's an ERC20 token contract

**If the contract doesn't exist:**
- You may need to deploy your own test PYUSD contract on Sepolia
- Or use a different test token address
- Update `VITE_PYUSD_CONTRACT_ADDRESS` in `.env`

### Getting Test PYUSD
Since this is Sepolia testnet, you'll need:
1. Sepolia ETH for gas fees: https://sepoliafaucet.com/
2. Test PYUSD tokens (if contract exists) or deploy your own ERC20 test token

## 🔧 Troubleshooting

### "Contract not found" Error
- The PYUSD contract may not be deployed on Sepolia
- Check console for contract verification warnings
- Consider deploying a test ERC20 token or using an existing test USDC/USDT on Sepolia

### Balance Shows 0
- Normal if you haven't received any PYUSD on Sepolia
- Verify contract address is correct
- Check RPC connection in console

### RPC Errors
- If you see CORS or 429 errors, your Alchemy API key may have issues
- Create a new key at https://dashboard.alchemy.com/
- Update `VITE_ARBITRUM_RPC_URL` in `.env`

## 📝 Next Steps

1. **Verify PYUSD Contract**: Confirm the contract exists on Sepolia or deploy a test token
2. **Test Payment Flow**: Create payment link → Connect wallet → Complete payment
3. **Test Transaction History**: Verify transactions appear after completion
4. **Production Ready**: Update to Mainnet values when ready to deploy

## 🔐 Security Notes

- Never commit `.env` file to Git (already in .gitignore)
- Rotate Alchemy API key before public deployment
- Use different keys for development/production
