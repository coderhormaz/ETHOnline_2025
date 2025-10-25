import { supabase } from '../lib/supabase';

export interface PaymentLink {
  id: string;
  link_id: string;
  recipient_user_id: string;
  recipient_handle: string;
  recipient_address: string;
  amount: string;
  note?: string;
  title?: string;
  custom_message?: string;
  color?: string;
  max_uses?: number;
  current_uses: number;
  is_active: boolean;
  expires_at?: string;
  paid: boolean;
  paid_at?: string;
  paid_by_address?: string;
  tx_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentLinkData {
  amount: string;
  note?: string;
  title?: string;
  custom_message?: string;
  color?: string;
  max_uses?: number;
  expiresInHours?: number;
}

export interface UpdatePaymentLinkData {
  amount?: string;
  note?: string;
  title?: string;
  custom_message?: string;
  color?: string;
  max_uses?: number;
  is_active?: boolean;
}

/**
 * Generate a unique link ID
 */
function generateLinkId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

/**
 * Create a new payment link
 */
export async function createPaymentLink(
  userId: string,
  handle: string,
  publicAddress: string,
  data: CreatePaymentLinkData
): Promise<{ success: boolean; linkId?: string; error?: string }> {
  try {
    const linkId = generateLinkId();
    
    // Calculate expiration time if provided
    let expiresAt = null;
    if (data.expiresInHours && data.expiresInHours > 0) {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + data.expiresInHours);
      expiresAt = expirationDate.toISOString();
    }

    const { error } = await supabase
      .from('payment_links')
      .insert({
        link_id: linkId,
        recipient_user_id: userId,
        recipient_handle: handle,
        recipient_address: publicAddress,
        amount: data.amount,
        note: data.note || null,
        title: data.title || null,
        custom_message: data.custom_message || null,
        color: data.color || '#9333ea',
        max_uses: data.max_uses || null,
        current_uses: 0,
        is_active: true,
        expires_at: expiresAt,
        paid: false
      });

    if (error) {
      console.error('Error creating payment link:', error);
      return { success: false, error: error.message };
    }

    return { success: true, linkId };
  } catch (error: any) {
    console.error('Error creating payment link:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get payment link by link ID
 */
export async function getPaymentLink(
  linkId: string
): Promise<{ success: boolean; data?: PaymentLink; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('link_id', linkId)
      .single();

    if (error) {
      console.error('Error fetching payment link:', error);
      return { success: false, error: 'Payment link not found' };
    }

    // Check if link has expired
    if (data.expires_at) {
      const expirationDate = new Date(data.expires_at);
      if (expirationDate < new Date()) {
        return { success: false, error: 'Payment link has expired' };
      }
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching payment link:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark payment link as paid
 */
export async function markPaymentLinkPaid(
  linkId: string,
  txHash: string,
  paidByAddress: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First check if already paid and increment usage
    const { data: existing } = await supabase
      .from('payment_links')
      .select('paid, current_uses, max_uses')
      .eq('link_id', linkId)
      .single();

    if (existing?.paid) {
      return { success: false, error: 'This payment link has already been paid' };
    }
    
    // Check if max uses would be exceeded
    if (existing?.max_uses && existing.current_uses >= existing.max_uses) {
      return { success: false, error: 'Maximum uses exceeded' };
    }

    const { error } = await supabase
      .from('payment_links')
      .update({
        paid: true,
        paid_at: new Date().toISOString(),
        paid_by_address: paidByAddress,
        tx_hash: txHash,
        current_uses: (existing?.current_uses || 0) + 1
      })
      .eq('link_id', linkId);

    if (error) {
      console.error('Error marking payment as paid:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error marking payment as paid:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all payment links for a user
 */
export async function getUserPaymentLinks(
  userId: string
): Promise<{ success: boolean; data?: PaymentLink[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('recipient_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user payment links:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching user payment links:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get payment link statistics
 */
export async function getPaymentLinkStats(
  userId: string
): Promise<{
  totalLinks: number;
  paidLinks: number;
  totalReceived: number;
  pendingAmount: number;
}> {
  try {
    const { data } = await supabase
      .from('payment_links')
      .select('paid, amount')
      .eq('recipient_user_id', userId);

    if (!data) {
      return { totalLinks: 0, paidLinks: 0, totalReceived: 0, pendingAmount: 0 };
    }

    const totalLinks = data.length;
    const paidLinks = data.filter(link => link.paid).length;
    const totalReceived = data
      .filter(link => link.paid)
      .reduce((sum, link) => sum + parseFloat(link.amount), 0);
    const pendingAmount = data
      .filter(link => !link.paid)
      .reduce((sum, link) => sum + parseFloat(link.amount), 0);

    return { totalLinks, paidLinks, totalReceived, pendingAmount };
  } catch (error) {
    console.error('Error fetching payment link stats:', error);
    return { totalLinks: 0, paidLinks: 0, totalReceived: 0, pendingAmount: 0 };
  }
}

/**
 * Update payment link
 */
export async function updatePaymentLink(
  linkId: string,
  updates: UpdatePaymentLinkData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('payment_links')
      .update(updates)
      .eq('link_id', linkId)
      .eq('paid', false); // Only allow updates to unpaid links

    if (error) {
      console.error('Error updating payment link:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating payment link:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete payment link
 */
export async function deletePaymentLink(
  linkId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('payment_links')
      .delete()
      .eq('link_id', linkId);

    if (error) {
      console.error('Error deleting payment link:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting payment link:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Extend payment link expiry
 */
export async function extendExpiry(
  linkId: string,
  additionalHours: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current link
    const { data: link } = await supabase
      .from('payment_links')
      .select('expires_at')
      .eq('link_id', linkId)
      .single();

    if (!link) {
      return { success: false, error: 'Payment link not found' };
    }

    // Calculate new expiry
    const baseDate = link.expires_at ? new Date(link.expires_at) : new Date();
    baseDate.setHours(baseDate.getHours() + additionalHours);

    const { error } = await supabase
      .from('payment_links')
      .update({ expires_at: baseDate.toISOString() })
      .eq('link_id', linkId);

    if (error) {
      console.error('Error extending expiry:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error extending expiry:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Toggle payment link active status
 */
export async function toggleActive(
  linkId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('payment_links')
      .update({ is_active: isActive })
      .eq('link_id', linkId);

    if (error) {
      console.error('Error toggling active status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error toggling active status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Increment usage count for a payment link
 */
export async function incrementUsageCount(
  linkId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current link
    const { data: link } = await supabase
      .from('payment_links')
      .select('current_uses, max_uses')
      .eq('link_id', linkId)
      .single();

    if (!link) {
      return { success: false, error: 'Payment link not found' };
    }

    // Check if max uses exceeded
    if (link.max_uses && link.current_uses >= link.max_uses) {
      return { success: false, error: 'Maximum uses exceeded' };
    }

    const { error } = await supabase
      .from('payment_links')
      .update({ current_uses: link.current_uses + 1 })
      .eq('link_id', linkId);

    if (error) {
      console.error('Error incrementing usage count:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error incrementing usage count:', error);
    return { success: false, error: error.message };
  }
}
