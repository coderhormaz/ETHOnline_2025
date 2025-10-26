import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Link as LinkIcon, 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Copy,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  DollarSign,
  Eye,
  QrCode,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserPaymentLinks, getPaymentLinkStats, deletePaymentLink, toggleActive, type PaymentLink } from '../services/paymentLinks';
import { useToast } from '../components/Toast';
import QRCode from 'react-qr-code';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export default function PaymentLinks() {
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paid' | 'expired'>('all');
  const [stats, setStats] = useState({
    totalLinks: 0,
    paidLinks: 0,
    totalReceived: 0,
    pendingAmount: 0
  });
  const [selectedLink, setSelectedLink] = useState<PaymentLink | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to payment_links changes for this user
    const channel = supabase
      .channel('payment_links_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'payment_links',
          filter: `recipient_user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          
          // Handle different event types
          if (payload.eventType === 'INSERT') {
            const newLink = payload.new as PaymentLink;
            setLinks(prev => [newLink, ...prev]);
            showToast('New payment link created', 'success');
          } else if (payload.eventType === 'UPDATE') {
            const updatedLink = payload.new as PaymentLink;
            setLinks(prev => prev.map(link => 
              link.id === updatedLink.id ? updatedLink : link
            ));
            
            // Show notification if link was paid
            if (updatedLink.paid && !payload.old.paid) {
              showToast(`💰 Payment received: $${updatedLink.amount}!`, 'success');
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setLinks(prev => prev.filter(link => link.id !== deletedId));
          }
          
          // Refresh stats after any change
          loadStats();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    subscriptionRef.current = channel;

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadPaymentLinks();
      loadStats();
    }
  }, [user]);

  useEffect(() => {
    filterLinks();
  }, [links, searchQuery, filterStatus]);

  const loadPaymentLinks = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    const result = await getUserPaymentLinks(user.id);
    
    if (result.success && result.data) {
      setLinks(result.data);
    } else {
      showToast(result.error || 'Failed to load payment links', 'error');
    }
    
    setLoading(false);
  };

  const loadStats = async () => {
    if (!user?.id) return;
    const statsData = await getPaymentLinkStats(user.id);
    setStats(statsData);
  };

  const filterLinks = () => {
    let filtered = [...links];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(link => 
        link.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.amount.includes(searchQuery)
      );
    }

    // Apply status filter
    if (filterStatus === 'paid') {
      filtered = filtered.filter(link => link.paid);
    } else if (filterStatus === 'active') {
      filtered = filtered.filter(link => !link.paid && link.is_active && isLinkValid(link));
    } else if (filterStatus === 'expired') {
      filtered = filtered.filter(link => !link.paid && !isLinkValid(link));
    }

    setFilteredLinks(filtered);
  };

  const isLinkValid = (link: PaymentLink): boolean => {
    if (!link.is_active) return false;
    if (link.expires_at && new Date(link.expires_at) < new Date()) return false;
    if (link.max_uses && link.current_uses >= link.max_uses) return false;
    return true;
  };

  const getTimeRemaining = (expiresAt?: string): string => {
    if (!expiresAt) return 'No expiration';
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff < 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleCopyLink = (linkId: string) => {
    const url = `${window.location.origin}/pay/${linkId}`;
    navigator.clipboard.writeText(url);
    showToast('Payment link copied to clipboard', 'success');
    setActionMenuOpen(null);
  };

  const handleToggleActive = async (link: PaymentLink) => {
    const result = await toggleActive(link.link_id, !link.is_active);
    
    if (result.success) {
      showToast(`Link ${link.is_active ? 'deactivated' : 'activated'}`, 'success');
      loadPaymentLinks();
    } else {
      showToast(result.error || 'Failed to toggle link status', 'error');
    }
    setActionMenuOpen(null);
  };

  const handleDelete = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this payment link?')) return;
    
    const result = await deletePaymentLink(linkId);
    
    if (result.success) {
      showToast('Payment link deleted', 'success');
      loadPaymentLinks();
      loadStats();
    } else {
      showToast(result.error || 'Failed to delete payment link', 'error');
    }
    setActionMenuOpen(null);
  };

  const handleViewQR = (link: PaymentLink) => {
    setSelectedLink(link);
    setShowQRModal(true);
    setActionMenuOpen(null);
  };

  const getStatusBadge = (link: PaymentLink) => {
    if (link.paid) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Paid
        </span>
      );
    }
    
    if (!isLinkValid(link)) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Expired
        </span>
      );
    }
    
    return (
      <span className="px-2 py-1 text-xs font-medium bg-purple-500/20 text-purple-400 rounded-full flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Active
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 md:pl-64 pb-24">
      <ToastContainer />
      {/* Header */}
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <LinkIcon className="w-6 h-6" />
              Payment Links
              {/* Real-time connection indicator */}
              {realtimeConnected ? (
                <span className="flex items-center gap-1 text-xs font-normal text-green-600 dark:text-green-300 bg-green-500/20 px-2 py-1 rounded-full">
                  <Wifi className="w-3 h-3" />
                  Live
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-500/20 px-2 py-1 rounded-full">
                  <WifiOff className="w-3 h-3" />
                  Offline
                </span>
              )}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {realtimeConnected 
                ? 'Real-time updates enabled - you\'ll see payments instantly' 
                : 'Manage and track your payment links'}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/receive'}
            className="px-4 py-2 bg-gradient-primary text-white rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-glow"
          >
            <Plus className="w-5 h-5" />
            Create New
          </motion.button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-3 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Total Links</p>
                <p className="text-gray-900 dark:text-white text-lg font-bold">{stats.totalLinks}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-3 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Paid Links</p>
                <p className="text-gray-900 dark:text-white text-lg font-bold">{stats.paidLinks}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-3 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Total Received</p>
                <p className="text-gray-900 dark:text-white text-lg font-bold">${stats.totalReceived.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-3 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Pending</p>
                <p className="text-gray-900 dark:text-white text-lg font-bold">${stats.pendingAmount.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filter */}
        <div className="space-y-3 mb-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, note, or amount..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'active', 'paid', 'expired'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  filterStatus === status
                    ? 'bg-gradient-primary text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Links List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-purple-300 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : filteredLinks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <LinkIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4 opacity-50" />
            <p className="text-gray-700 dark:text-gray-300 text-lg mb-2">No payment links found</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Create your first payment link to get started</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredLinks.map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-lg"
                style={{ borderLeftColor: link.color || '#9333ea', borderLeftWidth: '4px' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-gray-900 dark:text-white font-semibold">
                        {link.title || `Payment Link #${link.link_id.slice(0, 8)}`}
                      </h3>
                      {getStatusBadge(link)}
                    </div>
                    {link.note && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{link.note}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${link.amount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeRemaining(link.expires_at)}
                      </span>
                      {link.max_uses && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {link.current_uses}/{link.max_uses} uses
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(link.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setActionMenuOpen(actionMenuOpen === link.link_id ? null : link.link_id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>

                    {actionMenuOpen === link.link_id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl overflow-hidden z-10"
                      >
                        <button
                          onClick={() => handleCopyLink(link.link_id)}
                          className="w-full px-4 py-3 text-left hover:bg-purple-50 flex items-center gap-3 text-gray-700"
                        >
                          <Copy className="w-4 h-4" />
                          Copy Link
                        </button>
                        <button
                          onClick={() => handleViewQR(link)}
                          className="w-full px-4 py-3 text-left hover:bg-primary-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                        >
                          <QrCode className="w-4 h-4" />
                          View QR Code
                        </button>
                        {!link.paid && (
                          <>
                            <button
                              onClick={() => handleToggleActive(link)}
                              className="w-full px-4 py-3 text-left hover:bg-primary-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                            >
                              {link.is_active ? (
                                <>
                                  <ToggleLeft className="w-4 h-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="w-4 h-4" />
                                  Activate
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(link.link_id)}
                              className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>

                {link.paid && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Paid on {new Date(link.paid_at!).toLocaleString()}</p>
                    {link.tx_hash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${link.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline"
                      >
                        View Transaction
                      </a>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedLink && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowQRModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              {selectedLink.title || 'Payment Link'}
            </h3>
            <div className="bg-white p-6 rounded-2xl mb-4">
              <QRCode
                value={`${window.location.origin}/pay/${selectedLink.link_id}`}
                size={256}
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                viewBox={`0 0 256 256`}
              />
            </div>
            <p className="text-center text-gray-600 text-sm mb-4">
              ${selectedLink.amount} PYUSD
            </p>
            <button
              onClick={() => handleCopyLink(selectedLink.link_id)}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
            >
              Copy Link
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
