# 💳 Blockchain UPI MVP - PYUSD on Arbitrum

A modern, secure Web3 payment application that brings UPI-like instant payments to blockchain using PYUSD on Arbitrum. Built with React, TypeScript, Supabase, and ethers.js.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg)

---

## ✨ Features

### 🔐 **Secure Authentication**
- Email + password authentication via Supabase
- Automatic wallet generation on signup
- AES-256 encrypted private keys
- Never exposes private keys to client

### 💼 **Smart Wallet Management**
- Auto-generated EVM wallets
- Unique payment handles (`@username@pyusd`)
- Encrypted private key storage
- Balance tracking and transaction history

### 💸 **Instant Payments**
- Send PYUSD via unique handles or wallet addresses
- QR code generation for easy receiving
- Real-time transaction tracking
- Blockchain explorer integration

### 🎨 **Premium UI/UX**
- Apple Pay & Paytm-inspired design
- Smooth animations with Framer Motion
- Glassmorphism effects
- Fully responsive (mobile-first)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Arbitrum RPC access

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

Visit http://localhost:5173

---

## 📖 Usage

1. **Sign Up** - Create account with email, password, and unique handle
2. **Dashboard** - View balance, handle, and wallet address
3. **Receive** - Generate QR code with your handle
4. **Send** - Pay via handle or address
5. **History** - Track all transactions

---

## 🛠️ Tech Stack

- React 18.3 + TypeScript + Vite
- TailwindCSS 3.4 + Framer Motion
- Supabase (Auth + Database)
- ethers.js 6.x (Blockchain)
- Arbitrum + PYUSD

---

## 📚 Documentation

- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Complete testing instructions
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide

---

## 🔒 Security

✅ AES-256 encrypted private keys  
✅ Row Level Security (RLS)  
✅ Server-side transaction signing  
✅ Input validation & sanitization  

---

## 🚀 Deploy

```bash
# Build for production
npm run build

# Deploy to Vercel
npx vercel --prod
```

---

## 📞 Support

- GitHub Issues: [Create an issue](https://github.com/coderhormaz/ETHOnline_2025/issues)
- Documentation: See TESTING_GUIDE.md

---

**Built with ❤️ for ETHOnline 2025**
