import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../styles/theme';
import { getAdminWithdrawals, approveWithdrawal, rejectWithdrawal, deleteWithdrawal } from '../../services/api';

interface WithdrawalRecord {
  id: string;
  withdrawal_id: string;
  user_id: string;
  amount: number;
  rupees_amount: number;
  upi_id?: string;
  account_number?: string;
  ifsc_code?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  processed_at?: string;
  remaining_coins: number;
}

interface WithdrawalManagementProps {
  userRole?: 'admin' | 'moderator';
}

export const WithdrawalManagement: React.FC<WithdrawalManagementProps> = ({ userRole = 'admin' }) => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'failed' | 'cancelled'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWithdrawals();
  }, [filterStatus]);

  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const response = await getAdminWithdrawals(filterStatus === 'all' ? undefined : filterStatus);
      setWithdrawals(response.data || response || []);
    } catch (error: any) {
      console.error('Failed to load withdrawals:', error);
      Alert.alert('Error', 'Failed to load withdrawal records');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWithdrawals();
    setRefreshing(false);
  };

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    Alert.alert(
      'Approve Withdrawal',
      'Are you sure you want to approve this withdrawal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await approveWithdrawal(withdrawalId);
              Alert.alert('Success', 'Withdrawal approved successfully');
              loadWithdrawals();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to approve withdrawal');
            }
          },
          style: 'default',
        },
      ]
    );
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    Alert.alert(
      'Reject Withdrawal',
      'Are you sure you want to reject this withdrawal? Coins will be refunded to the user.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: async () => {
            try {
              await rejectWithdrawal(withdrawalId);
              Alert.alert('Success', 'Withdrawal rejected and coins refunded');
              loadWithdrawals();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject withdrawal');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleDeleteWithdrawal = async (withdrawalId: string, userId: string) => {
    Alert.alert(
      'Delete Withdrawal',
      'Are you sure you want to permanently delete this withdrawal record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteWithdrawal(withdrawalId, userId);
              Alert.alert('Success', 'Withdrawal record deleted successfully');
              loadWithdrawals();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete withdrawal');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    const query = searchQuery.toLowerCase();
    return (
      w.user_id.toString().includes(query) ||
      w.withdrawal_id.toLowerCase().includes(query) ||
      (w.upi_id?.toLowerCase().includes(query)) ||
      (w.account_number?.includes(query))
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'failed':
        return colors.error;
      case 'cancelled':
        return colors.textSecondary;
      default:
        return colors.text;
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'completed':
        return '#D1FAE520';
      case 'pending':
        return '#FEF3C720';
      case 'failed':
        return '#FEE2E220';
      case 'cancelled':
        return '#F3F4F620';
      default:
        return '#F9FAFB';
    }
  };

  const renderWithdrawalItem = (item: WithdrawalRecord) => (
    <View style={[styles.withdrawalCard, { borderLeftColor: getStatusColor(item.status) }]}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.userId}>User #{item.user_id}</Text>
          <Text style={styles.withdrawalId}>{item.withdrawal_id.substring(0, 8)}...</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBackground(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        {/* Amount */}
        <View style={styles.detailRow}>
          <MaterialIcons name="account-balance-wallet" size={18} color={colors.primary} />
          <View style={styles.detailText}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>₹{item.rupees_amount.toFixed(2)}</Text>
          </View>
        </View>

        {/* UPI or Bank Details */}
        {item.upi_id && (
          <View style={styles.detailRow}>
            <MaterialIcons name="payments" size={18} color={colors.secondary} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>UPI</Text>
              <Text style={styles.detailValue}>{item.upi_id}</Text>
            </View>
          </View>
        )}

        {item.account_number && (
          <>
            <View style={styles.detailRow}>
              <MaterialIcons name="account-balance" size={18} color={colors.secondary} />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Account</Text>
                <Text style={styles.detailValue}>{item.account_number}</Text>
              </View>
            </View>
            {item.ifsc_code && (
              <View style={styles.detailRow}>
                <MaterialIcons name="info-outline" size={18} color={colors.secondary} />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>IFSC</Text>
                  <Text style={styles.detailValue}>{item.ifsc_code}</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Created Date */}
        <View style={styles.detailRow}>
          <MaterialIcons name="schedule" size={18} color={colors.textSecondary} />
          <View style={styles.detailText}>
            <Text style={styles.detailLabel}>Requested</Text>
            <Text style={styles.detailValue}>
              {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {item.status === 'pending' && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.approveButton]}
              onPress={() => handleApproveWithdrawal(item.withdrawal_id)}
            >
              <MaterialIcons name="check-circle" size={16} color={colors.white} />
              <Text style={styles.buttonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={() => handleRejectWithdrawal(item.withdrawal_id)}
            >
              <MaterialIcons name="cancel" size={16} color={colors.white} />
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => handleDeleteWithdrawal(item.withdrawal_id, item.user_id)}
        >
          <MaterialIcons name="delete" size={16} color={colors.white} />
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search and Filter Section */}
      <View style={styles.filterContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by User ID, UPI, or Account..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Status Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {['all', 'pending', 'completed', 'failed', 'cancelled'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(status as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.filterButtonTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Withdrawal List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading withdrawals...</Text>
        </View>
      ) : filteredWithdrawals.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="inbox" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No withdrawals found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredWithdrawals}
          renderItem={({ item }) => renderWithdrawalItem(item)}
          keyExtractor={(item) => item.withdrawal_id}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  filterScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.white,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  withdrawalCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  userId: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  withdrawalId: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
  },
  cardContent: {
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    flex: 1,
    minWidth: '48%',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.warning,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  buttonText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
});

export default WithdrawalManagement;