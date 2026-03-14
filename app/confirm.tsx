/**
 * Confirmation screen shown after a successful ERPNext expense claim submission.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Share,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadERPNextConfig } from '../services/storage';
import { getExpenseClaimUrl } from '../services/erpnext';

export default function ConfirmScreen() {
  const { claimId, vendor, amount } = useLocalSearchParams<{
    claimId: string;
    vendor: string;
    amount: string;
  }>();

  const parsedAmount = parseFloat(amount || '0');

  const handleViewInERPNext = async () => {
    const config = await loadERPNextConfig();
    if (!config) return;
    const url = getExpenseClaimUrl(claimId, config);
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  const handleScanAnother = () => {
    router.replace('/scan');
  };

  const handleGoHome = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'top']}>
      <View style={styles.container}>
        {/* Success illustration */}
        <View style={styles.successCircle}>
          <Text style={styles.successIcon}>✓</Text>
        </View>

        <Text style={styles.title}>Expense Submitted!</Text>
        <Text style={styles.subtitle}>
          Your expense claim has been created in ERPNext.
        </Text>

        {/* Claim details card */}
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Claim ID</Text>
            <Text style={styles.detailValueBold}>{claimId}</Text>
          </View>
          {vendor && (
            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>Vendor</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {vendor}
              </Text>
            </View>
          )}
          {parsedAmount > 0 && (
            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>
                ${parsedAmount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.detailRow, styles.detailRowBorder]}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Draft</Text>
            </View>
          </View>
        </View>

        <Text style={styles.nextStepsNote}>
          Your claim is in Draft status in ERPNext and is ready for review and approval.
        </Text>

        {/* Actions */}
        <TouchableOpacity
          style={styles.viewButton}
          onPress={handleViewInERPNext}
          activeOpacity={0.8}
        >
          <Text style={styles.viewButtonText}>View in ERPNext</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.scanAnotherButton}
          onPress={handleScanAnother}
          activeOpacity={0.8}
        >
          <Text style={styles.scanAnotherText}>📷  Scan Another Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeLink} onPress={handleGoHome}>
          <Text style={styles.homeLinkText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  successIcon: {
    fontSize: 40,
    color: '#fff',
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  detailRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    maxWidth: '55%',
    textAlign: 'right',
  },
  detailValueBold: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  nextStepsNote: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  viewButton: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  scanAnotherButton: {
    width: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scanAnotherText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  homeLink: {
    padding: 8,
  },
  homeLinkText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
