/**
 * Premium Feature Service - Production Level
 * Simple, minimal, efficient feature access control
 * Backend: /api/subscriptions/status
 */

import { API_URL } from './api';

export interface SubscriptionStatus {
  isPremium: boolean;
  plan: 'free' | 'scholar' | 'genius';
  expiresAt?: string;
}

interface CachedStatus {
  data: SubscriptionStatus;
  timestamp: number;
}

class PremiumFeatureService {
  private statusCache = new Map<string, CachedStatus>();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  /**
   * Get subscription status from backend
   * Backend Endpoint: POST /api/subscriptions/status
   * Request: { user_id: string }
   * Response: { isPremium: boolean, plan: string, expiresAt?: string }
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    // Check cache
    const cached = this.statusCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }

    try {
      const response = await fetch(`${API_URL}/subscriptions/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: SubscriptionStatus = await response.json();
      this.statusCache.set(userId, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('[PremiumFeatureService] Status fetch failed:', error);
      return { isPremium: false, plan: 'free' };
    }
  }

  /**
   * Check if user is premium (quick check)
   */
  async isPremium(userId: string): Promise<boolean> {
    try {
      const status = await this.getSubscriptionStatus(userId);
      return status.isPremium;
    } catch {
      return false;
    }
  }

  /**
   * Clear cache for user (call after subscription)
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.statusCache.delete(userId);
    } else {
      this.statusCache.clear();
    }
  }

  /**
   * Private helper: Check if cache is still valid
   */
  private isCacheValid(): boolean {
    const now = Date.now();
    return (now - this.lastCacheTime) < this.cacheDuration;
  }
}

// Export singleton instance
export const premiumFeatureService = new PremiumFeatureService();
