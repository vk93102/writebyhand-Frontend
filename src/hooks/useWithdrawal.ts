import { useState, useCallback } from 'react';
import { requestCoinWithdrawal, getUserCoins } from '../services/api';

export interface WithdrawalState {
  loading: boolean;
  error: string | null;
  success: boolean;
  withdrawalId: string | null;
  remainingCoins: number | null;
}

export interface WithdrawalRequest {
  userId: string;
  coinsAmount: number;
  payoutMethod: 'upi' | 'bank';
  accountHolderName: string;
  upiId?: string;
  accountNumber?: string;
  ifscCode?: string;
}

/**
 * Custom hook for handling withdrawal operations
 * Provides loading, error, and success states
 */
export const useWithdrawal = () => {
  const [state, setState] = useState<WithdrawalState>({
    loading: false,
    error: null,
    success: false,
    withdrawalId: null,
    remainingCoins: null,
  });

  /**
   * Submit a withdrawal request
   */
  const submitWithdrawal = useCallback(async (request: WithdrawalRequest) => {
    try {
      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
        success: false,
      }));

      const response = await requestCoinWithdrawal(
        request.userId,
        request.coinsAmount,
        request.payoutMethod,
        request.accountHolderName,
        request.upiId,
        request.accountNumber,
        request.ifscCode
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Withdrawal request failed');
      }

      setState(prev => ({
        ...prev,
        loading: false,
        success: true,
        withdrawalId: response.data?.withdrawal_id || null,
        remainingCoins: response.data?.remaining_coins || null,
      }));

      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred during withdrawal';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        success: false,
      }));
      throw error;
    }
  }, []);

  /**
   * Reset withdrawal state
   */
  const resetState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      success: false,
      withdrawalId: null,
      remainingCoins: null,
    });
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    ...state,
    submitWithdrawal,
    resetState,
    clearError,
  };
};

/**
 * Custom hook for withdrawal validation
 */
export const useWithdrawalValidation = () => {
  const validateAmount = useCallback(
    (coins: number, userCoins: number): { valid: boolean; error?: string } => {
      if (!coins || coins <= 0) {
        return { valid: false, error: 'Please enter a valid amount' };
      }

      if (coins < 100) {
        return { valid: false, error: 'Minimum withdrawal is 100 coins (₹10)' };
      }

      if (coins > userCoins) {
        return {
          valid: false,
          error: `Insufficient balance. You have ${userCoins} coins`,
        };
      }

      return { valid: true };
    },
    []
  );

  const validateUPI = useCallback(
    (upiId: string): { valid: boolean; error?: string } => {
      const trimmed = upiId.trim();

      if (!trimmed) {
        return { valid: false, error: 'UPI ID is required' };
      }

      const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
      if (!upiRegex.test(trimmed)) {
        return {
          valid: false,
          error: 'Invalid UPI format. Example: yourname@ybl',
        };
      }

      return { valid: true };
    },
    []
  );

  const validateBankDetails = useCallback(
    (
      accountNumber: string,
      ifscCode: string
    ): { valid: boolean; error?: string } => {
      const accountTrimmed = accountNumber.trim();
      const ifscTrimmed = ifscCode.trim();

      if (!accountTrimmed || !ifscTrimmed) {
        return {
          valid: false,
          error: 'Account number and IFSC code are required',
        };
      }

      if (!/^\d{9,18}$/.test(accountTrimmed)) {
        return {
          valid: false,
          error: 'Invalid account number. Must be 9-18 digits',
        };
      }

      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(ifscTrimmed)) {
        return {
          valid: false,
          error: 'Invalid IFSC format. Example: SBIN0001234',
        };
      }

      return { valid: true };
    },
    []
  );

  const validateAccountHolderName = useCallback(
    (name: string): { valid: boolean; error?: string } => {
      const trimmed = name.trim();

      if (!trimmed) {
        return { valid: false, error: 'Account holder name is required' };
      }

      if (trimmed.length < 3) {
        return { valid: false, error: 'Name must be at least 3 characters' };
      }

      return { valid: true };
    },
    []
  );

  return {
    validateAmount,
    validateUPI,
    validateBankDetails,
    validateAccountHolderName,
  };
};

/**
 * Custom hook for managing withdrawal form state
 */
export const useWithdrawalForm = () => {
  const [coinsAmount, setCoinsAmount] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const reset = useCallback(() => {
    setCoinsAmount('');
    setAccountHolderName('');
    setPayoutMethod('upi');
    setUpiId('');
    setAccountNumber('');
    setIfscCode('');
  }, []);

  return {
    coinsAmount,
    setCoinsAmount,
    accountHolderName,
    setAccountHolderName,
    payoutMethod,
    setPayoutMethod,
    upiId,
    setUpiId,
    accountNumber,
    setAccountNumber,
    ifscCode,
    setIfscCode,
    reset,
  };
};
