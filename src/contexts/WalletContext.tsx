import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getPYUSDBalance, verifyPYUSDContract } from '../lib/blockchain/pyusd';
import { getBalanceFromBlockchain } from '../services/blockchainHistory';
import { getUserHandle } from '../services/handle';
import { useAuth } from './AuthContext';

interface WalletData {
  publicAddress: string;
  balance: string;
  handle: string;
}

interface WalletContextType {
  walletData: WalletData | null;
  loading: boolean;
  refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  // Verify contract on mount (only once)
  useEffect(() => {
    verifyPYUSDContract().then(result => {
      if (!result.valid) {
        console.warn('⚠️ PYUSD Contract Warning:', result.error);
      }
    });
  }, []);

  const fetchWalletData = async () => {
    if (!user) {
      setWalletData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch wallet from database
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('public_address')
        .eq('user_id', user.id)
        .single();

      if (walletError || !wallet) {
        console.error('Error fetching wallet:', walletError);
        setWalletData(null);
        setLoading(false);
        return;
      }

      // Fetch balance from blockchain
      const balance = await getPYUSDBalance(wallet.public_address);

      // Fetch handle
      const handle = await getUserHandle(user.id);

      setWalletData({
        publicAddress: wallet.public_address,
        balance,
        handle: handle || '',
      });
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      setWalletData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  const refreshWallet = async () => {
    await fetchWalletData();
  };

  const value = {
    walletData,
    loading,
    refreshWallet,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
