# 🧪 Testing Guide - Blockchain UPI MVP

## Prerequisites
- ✅ Dev server running at http://localhost:5175/
- ✅ Supabase database configured
- ✅ Environment variables set in `.env`

---

## 🚀 Quick Start Testing

### 1️⃣ Test User Registration

**Steps:**
1. Open http://localhost:5175/signup
2. Fill in the form:
   - **Email:** `test@example.com`
   - **Password:** `Password123!`
   - **Handle:** `john` (will become `john@pyusd`)
3. Click **Sign Up**

**Expected Results:**
- ✅ Loading animation appears
- ✅ Wallet is auto-generated
- ✅ Redirect to `/dashboard`
- ✅ Success message shows

**Verify in Supabase:**
```sql
-- Check user was created
SELECT * FROM auth.users WHERE email = 'test@example.com';

-- Check wallet was created
SELECT public_address FROM wallets 
JOIN auth.users ON wallets.user_id = users.id 
WHERE users.email = 'test@example.com';

-- Check handle was created
SELECT handle FROM handles 
JOIN auth.users ON handles.user_id = users.id 
WHERE users.email = 'test@example.com';
```

---

### 2️⃣ Test Login & Dashboard

**Steps:**
1. Logout if logged in
2. Go to http://localhost:5175/
3. Login with:
   - **Email:** `test@example.com`
   - **Password:** `Password123!`
4. Verify dashboard loads

**Expected Results:**
- ✅ Login successful
- ✅ Redirect to `/dashboard`
- ✅ Balance card displays (showing 0 PYUSD initially)
- ✅ Handle displays as `@john@pyusd`
- ✅ Wallet address shows (truncated: `0x1234...5678`)
- ✅ Copy button works
- ✅ Three action buttons: Send, Receive, History

**Visual Checks:**
- Premium gradient background
- Smooth animations on load
- Glassmorphism effect on card
- Responsive layout

---

### 3️⃣ Test QR Code Receive

**Steps:**
1. On dashboard, click **Receive** button
2. Modal should open with QR code
3. QR code should encode your handle: `john@pyusd`
4. Test download button
5. Close modal

**Expected Results:**
- ✅ Modal opens with smooth animation
- ✅ QR code displays your handle
- ✅ Download QR button works
- ✅ Close button/backdrop click closes modal

---

### 4️⃣ Get Test Tokens (IMPORTANT)

Before you can test sending payments, you need funds in your wallet.

**Steps:**

**A. Copy Your Wallet Address**
1. Go to dashboard
2. Click copy icon next to wallet address
3. Your address should be like: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb9`

**B. Get Arbitrum Testnet ETH** (for gas fees)
1. Visit: https://faucet.quicknode.com/arbitrum/sepolia
2. OR: https://www.alchemy.com/faucets/arbitrum-sepolia
3. Paste your wallet address
4. Request testnet ETH
5. Wait 1-2 minutes for confirmation

**C. Get Test USDT Tokens** (PYUSD proxy)
Since PYUSD might not be on Arbitrum testnet yet, we use USDT:
1. Visit: https://faucet.circle.com/ (if available)
2. OR send testnet USDT from another wallet
3. Contract: `0x6c3ea9036406852006290770BEdFcAbA0e23A0e8`

**D. Verify Balance**
1. Refresh dashboard
2. Balance should update to show your USDT/PYUSD amount
3. If not showing, check Arbiscan: https://arbiscan.io/address/YOUR_ADDRESS

---

### 5️⃣ Test Send Payment via Handle

**Setup - Create Second User:**
1. Open incognito/private window
2. Sign up another account:
   - **Email:** `alice@example.com`
   - **Password:** `Password123!`
   - **Handle:** `alice` (becomes `alice@pyusd`)
3. Note Alice's handle: `alice@pyusd`

**Test Sending:**
1. In your main account (john), click **Send**
2. Fill form:
   - **To Handle:** `alice@pyusd`
   - **Amount:** `1` (1 PYUSD)
3. Click **Send Payment**
4. Confirm transaction

**Expected Results:**
- ✅ Handle validates (green checkmark)
- ✅ Amount validates (positive number)
- ✅ Confirmation modal appears
- ✅ Transaction submitted
- ✅ Success animation (confetti/checkmark)
- ✅ Transaction hash displayed
- ✅ Explorer link provided
- ✅ Balance updates after confirmation

**Error Cases to Test:**
- ❌ Invalid handle → Shows error
- ❌ Sending to self → Shows error
- ❌ Amount > balance → Shows insufficient funds
- ❌ Invalid amount (negative, zero) → Shows error

---

### 6️⃣ Test Transaction History

**Steps:**
1. After sending payment, go to `/transactions` page
2. Or click **History** on dashboard

**Expected Results:**
- ✅ Sent transaction appears in list
- ✅ Transaction shows:
  - ✅ Status badge (Pending → Confirmed)
  - ✅ Recipient: `alice@pyusd`
  - ✅ Amount: `1.00 PYUSD`
  - ✅ Timestamp
  - ✅ Transaction hash (truncated)
  - ✅ "View on Explorer" link
- ✅ Click explorer link → Opens Arbiscan
- ✅ Transaction visible on blockchain

**In Alice's Account:**
- ✅ Login as Alice
- ✅ Check transactions page
- ✅ Received transaction appears
- ✅ Shows sender: `john@pyusd`
- ✅ Balance updated

---

### 7️⃣ Security Verification ⚠️

**CRITICAL TESTS:**

**A. Private Key Never Exposed**
1. Open DevTools (F12)
2. Go to **Network** tab
3. Clear network log
4. Perform signup
5. Check all network requests
6. **VERIFY:** `encrypted_private_key` is NEVER in responses
7. **VERIFY:** Only `public_address` and `handle` are sent to client

**B. Authentication Required**
1. Logout
2. Try to access `/dashboard` directly
3. **VERIFY:** Redirected to login
4. Try to access `/transactions`
5. **VERIFY:** Redirected to login

**C. SQL Injection Prevention**
1. Try handles with special chars: `'; DROP TABLE--`
2. **VERIFY:** Validation rejects invalid characters
3. **VERIFY:** Only `[a-z0-9._-]@pyusd` accepted

**D. XSS Prevention**
1. Try handle: `<script>alert('xss')</script>`
2. **VERIFY:** Blocked by validation
3. Display should escape HTML

---

### 8️⃣ Mobile Responsiveness

**Steps:**
1. Open DevTools (F12)
2. Click device toggle (Ctrl+Shift+M)
3. Test these viewports:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - Desktop (1920px)

**Checks for Each Viewport:**
- ✅ All text is readable
- ✅ Buttons are touch-friendly (min 44px)
- ✅ Modals fit screen
- ✅ Forms are usable
- ✅ No horizontal scroll
- ✅ Navbar/header responsive
- ✅ Balance card scales properly
- ✅ Transaction list readable

---

### 9️⃣ Performance & Animations

**Check Console:**
1. Open DevTools → Console tab
2. Navigate through app
3. **VERIFY:** No errors or warnings

**Check Animations:**
- ✅ Login page: Fade-in animation smooth
- ✅ Dashboard: Slide-up animation on mount
- ✅ Modals: Scale-in animation
- ✅ Success: Confetti or checkmark animation
- ✅ Loading states: Spinner shows during async ops
- ✅ Transitions: Page changes are smooth

**Check Performance:**
- ✅ Pages load quickly (<1s)
- ✅ No jank during animations
- ✅ Balance updates after transactions
- ✅ Refresh multiple times - no memory leaks

---

### 🔟 Production Build Test

**Steps:**
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Open browser to preview URL
# Test all features again
```

**Verify:**
- ✅ Build completes without errors
- ✅ All features work in production mode
- ✅ Environment variables loaded
- ✅ No console errors
- ✅ Assets optimized (check Network tab)

---

## 🐛 Common Issues & Fixes

### Issue: Balance not updating
**Fix:** 
- Ensure you have test tokens
- Check RPC URL is correct
- Wait for blockchain confirmation (15-30 seconds)
- Refresh page

### Issue: Transaction fails
**Fix:**
- Check you have ETH for gas fees
- Verify recipient handle exists
- Check PYUSD balance sufficient
- Try with smaller amount first

### Issue: Handle already taken
**Fix:**
- Handles are unique
- Try different handle
- Check Supabase `handles` table

### Issue: Login doesn't work
**Fix:**
- Check Supabase credentials in `.env`
- Verify user exists in Supabase auth
- Check browser console for errors

---

## ✅ Testing Checklist

Copy this checklist and mark as you test:

- [ ] ✅ User registration works
- [ ] ✅ Wallet auto-created on signup
- [ ] ✅ Handle saved correctly
- [ ] ✅ Login works
- [ ] ✅ Dashboard displays correctly
- [ ] ✅ Balance card shows wallet info
- [ ] ✅ QR code generation works
- [ ] ✅ Copy address button works
- [ ] ✅ Send modal opens
- [ ] ✅ Handle validation works
- [ ] ✅ Amount validation works
- [ ] ✅ Payment sends successfully
- [ ] ✅ Transaction hash returned
- [ ] ✅ Transaction history displays
- [ ] ✅ Explorer link works
- [ ] ✅ Received transactions show
- [ ] ✅ Private keys never exposed
- [ ] ✅ Protected routes work
- [ ] ✅ Mobile responsive
- [ ] ✅ Animations smooth
- [ ] ✅ No console errors
- [ ] ✅ Production build works

---

## 📊 Test Data Reference

Use these test accounts:

| User | Email | Password | Handle |
|------|-------|----------|--------|
| John | test@example.com | Password123! | john@pyusd |
| Alice | alice@example.com | Password123! | alice@pyusd |
| Bob | bob@example.com | Password123! | bob@pyusd |

---

## 🚀 Next Steps

After testing locally:
1. ✅ All tests passing
2. 📝 Document any bugs found
3. 🔧 Fix critical issues
4. 🚀 Deploy to production (see DEPLOYMENT.md)
5. 🧪 Test on production
6. 🎉 Launch!

---

**Happy Testing! 🎊**
