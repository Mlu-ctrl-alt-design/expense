/**
 * Card component for displaying a pending (offline-queued) expense.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { PendingExpense } from '../types';
import { formatDateForDisplay } from '../utils/dateParser';

interface PendingExpenseCardProps {
  expense: PendingExpense;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function PendingExpenseCard({
  expense,
  onRetry,
  onDelete,
}: PendingExpenseCardProps) {
  const { extractedReceipt, status, errorMessage, retryCount } = expense;
  const isSubmitting = status === 'submitting';
  const isFailed = status === 'failed';

  return (
    <View style={[styles.card, isFailed && styles.cardFailed]}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.vendor} numberOfLines={1}>
            {extractedReceipt.vendor}
          </Text>
          <Text style={styles.date}>
            {formatDateForDisplay(extractedReceipt.date)}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>
            ${extractedReceipt.totalAmount.toFixed(2)}
          </Text>
          <View style={[styles.badge, isFailed ? styles.badgeFailed : styles.badgePending]}>
            <Text style={styles.badgeText}>
              {isSubmitting ? 'Sending...' : isFailed ? 'Failed' : 'Pending'}
            </Text>
          </View>
        </View>
      </View>

      {isFailed && errorMessage && (
        <Text style={styles.errorText} numberOfLines={2}>
          {errorMessage}
        </Text>
      )}

      {retryCount > 0 && (
        <Text style={styles.retryCountText}>
          Retry attempts: {retryCount}
        </Text>
      )}

      <View style={styles.actions}>
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#2563EB" />
        ) : (
          <>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => onRetry(expense.id)}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete(expense.id)}
            >
              <Text style={styles.deleteButtonText}>Discard</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardFailed: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  vendor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  date: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  badge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeFailed: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#DC2626',
    lineHeight: 16,
  },
  retryCountText: {
    marginTop: 4,
    fontSize: 11,
    color: '#9CA3AF',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  retryButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
});
