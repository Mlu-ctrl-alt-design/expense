/**
 * Home screen: scan button, pending queue, and navigation to settings.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  loadPendingExpenses,
  removePendingExpense,
  updatePendingExpenseStatus,
  loadERPNextConfig,
} from '../services/storage';
import { submitExpenseClaim } from '../services/erpnext';
import { PendingExpense, ERPNextConfig } from '../types';
import PendingExpenseCard from '../components/PendingExpenseCard';

export default function HomeScreen() {
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const [config, setConfig] = useState<ERPNextConfig | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [expenses, cfg] = await Promise.all([
      loadPendingExpenses(),
      loadERPNextConfig(),
    ]);
    setPendingExpenses(expenses);
    setConfig(cfg);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleScanPress = () => {
    if (!config) {
      Alert.alert(
        'Setup Required',
        'Please configure your ERPNext connection before scanning receipts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => router.push('/settings') },
        ],
      );
      return;
    }
    router.push('/scan');
  };

  const handleRetry = async (id: string) => {
    if (!config) return;
    const expense = pendingExpenses.find((e) => e.id === id);
    if (!expense) return;

    await updatePendingExpenseStatus(id, 'submitting');
    await loadData();

    try {
      const result = await submitExpenseClaim(expense.payload, config);
      await removePendingExpense(id);
      await loadData();
      router.push({
        pathname: '/confirm',
        params: {
          claimId: result.name,
          vendor: expense.extractedReceipt.vendor,
          amount: expense.extractedReceipt.totalAmount.toString(),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Submission failed';
      await updatePendingExpenseStatus(id, 'failed', message);
      await loadData();
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Discard Expense', 'Remove this pending expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await removePendingExpense(id);
          await loadData();
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const isConfigured = !!config;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>ExpenseScanner</Text>
            <Text style={styles.subtitle}>Receipt → ERPNext in seconds</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Setup prompt */}
        {!isConfigured && (
          <TouchableOpacity
            style={styles.setupBanner}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.setupBannerIcon}>⚠️</Text>
            <View style={styles.setupBannerText}>
              <Text style={styles.setupBannerTitle}>ERPNext not configured</Text>
              <Text style={styles.setupBannerSubtitle}>
                Tap to set up your connection
              </Text>
            </View>
            <Text style={styles.setupBannerChevron}>›</Text>
          </TouchableOpacity>
        )}

        {/* Status pill */}
        {isConfigured && (
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              Connected to {config.baseUrl.replace(/https?:\/\//, '')}
            </Text>
          </View>
        )}

        {/* Main scan button */}
        <TouchableOpacity
          style={[styles.scanButton, !isConfigured && styles.scanButtonDisabled]}
          onPress={handleScanPress}
          activeOpacity={0.8}
        >
          <Text style={styles.scanButtonIcon}>📷</Text>
          <Text style={styles.scanButtonText}>Scan Receipt</Text>
          <Text style={styles.scanButtonSub}>
            Capture and submit to ERPNext
          </Text>
        </TouchableOpacity>

        {/* Pending expenses */}
        {pendingExpenses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Pending ({pendingExpenses.length})
              </Text>
              <Text style={styles.sectionSubtitle}>
                Awaiting submission
              </Text>
            </View>
            {pendingExpenses.map((expense) => (
              <PendingExpenseCard
                key={expense.id}
                expense={expense}
                onRetry={handleRetry}
                onDelete={handleDelete}
              />
            ))}
          </View>
        )}

        {/* Empty state */}
        {pendingExpenses.length === 0 && isConfigured && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>✅</Text>
            <Text style={styles.emptyStateText}>All caught up!</Text>
            <Text style={styles.emptyStateSubtext}>
              No pending expenses to submit.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingTop: 8,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  settingsButton: {
    padding: 4,
  },
  settingsIcon: {
    fontSize: 26,
  },
  setupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  setupBannerIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  setupBannerText: {
    flex: 1,
  },
  setupBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  setupBannerSubtitle: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  setupBannerChevron: {
    fontSize: 20,
    color: '#92400E',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '500',
  },
  scanButton: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  scanButtonDisabled: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0.1,
  },
  scanButtonIcon: {
    fontSize: 44,
    marginBottom: 8,
  },
  scanButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  scanButtonSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
