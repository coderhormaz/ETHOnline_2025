# StackFlow - Blockchain UPI MVP

A modern, premium blockchain-based UPI payment system built on Arbitrum with PYUSD. Experience instant crypto payments with a sleek, Apple Pay-inspired interface.

## 🌟 Features

- **🔐 Secure Authentication** - Email/password authentication via Supabase
- **💼 Auto Wallet Creation** - Automatic EVM wallet generation on signup with encrypted private key storage
- **🏷️ Unique Payment Handles** - User-defined handles (e.g., `yourname@pyusd`) for easy payments
- **⚡ Instant Transfers** - Send PYUSD via handles or QR codes on Arbitrum
- **📱 QR Code Support** - Generate and scan QR codes for quick payments
- **📊 Transaction History** - View all past transactions with blockchain explorer links
- **🎨 Premium UI/UX** - Smooth, minimal interface with Framer Motion animations
- **🌙 Dark Mode** - Beautiful dark theme support

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS 3.4 + Framer Motion
- **Blockchain**: ethers.js 6.x + Arbitrum
- **Database**: Supabase (PostgreSQL with RLS)
- **Routing**: React Router v6
- **Encryption**: crypto-js (AES-256)

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Arbitrum RPC endpoint (use public RPC or your own)
- PYUSD contract address on Arbitrum

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/coderhormaz/ETHOnline_2025.git
cd ETHOnline_2025
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase Database

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase_schema.sql` in the Supabase SQL Editor
3. This will create all necessary tables and RLS policies

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Generate a strong 32-character encryption key
VITE_ENCRYPTION_SECRET_KEY=your_32_character_encryption_key

# Arbitrum Network
VITE_ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
VITE_ARBITRUM_CHAIN_ID=42161

# PYUSD Contract (update with actual contract address)
VITE_PYUSD_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
```

**⚠️ Important:** 
- Keep your `VITE_ENCRYPTION_SECRET_KEY` secure and never commit it
- Use the Supabase Service Role Key (not anon key) for `VITE_SUPABASE_SERVICE_ROLE_KEY`

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to see the app!

## 📱 How to Use

### First Time Setup

1. **Sign Up**: Create an account with email, password, and your unique handle
2. **Auto Wallet**: A secure wallet is automatically created and encrypted
3. **Receive Handle**: Get your unique payment handle (e.g., `hormaz@pyusd`)

### Sending Payments

1. Click **Send** on the dashboard
2. Enter recipient's handle (e.g., `friend@pyusd`)
3. Enter amount in PYUSD
4. Confirm and send!

### Receiving Payments

1. Click **Receive** on the dashboard
2. Share your QR code or payment handle
3. Receive instant PYUSD payments!

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── BalanceCard.tsx
│   ├── SendModal.tsx
│   ├── LoadingStates.tsx
│   ├── Toast.tsx
│   └── ProtectedRoute.tsx
├── contexts/           # React Context providers
│   ├── AuthContext.tsx
│   └── WalletContext.tsx
├── lib/                # Core utilities
│   ├── supabase.ts
│   ├── crypto.ts
│   ├── animations.ts
│   └── blockchain/
│       ├── provider.ts
│       └── pyusd.ts
├── pages/             # Application pages
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Dashboard.tsx
│   ├── Transactions.tsx
│   └── Receive.tsx
├── services/          # Business logic
│   ├── wallet.ts
│   ├── handle.ts
│   ├── transfer.ts
│   └── transactions.ts
└── App.tsx           # Main app component
```

## 🔒 Security Features

- **AES-256 Encryption** - Private keys encrypted before storage
- **Row Level Security** - Supabase RLS policies protect user data
- **Client-Side Safety** - Private keys never exposed to client
- **Server-Side Signing** - All transactions signed securely
- **Input Validation** - Comprehensive validation on all forms

## 🌐 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Make sure to add all environment variables in your deployment platform!

## 📊 Database Schema

The app uses 3 main tables:

- **wallets** - Stores encrypted private keys and public addresses
- **handles** - Unique payment handles for each user
- **transactions** - Payment history and transaction records

See `supabase_schema.sql` for complete schema with indexes and RLS policies.

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to customize the color scheme:

```js
colors: {
  primary: { ... },
  accent: { ... },
}
```

### Animations

Modify animation presets in `src/lib/animations.ts`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for your own purposes!

## 🙏 Acknowledgments

- Built for ETHOnline 2025
- Powered by Arbitrum & PYUSD
- UI inspired by Apple Pay & Paytm

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ by hormaz**
