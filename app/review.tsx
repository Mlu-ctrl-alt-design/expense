/**
 * Review screen: displays OCR-extracted data for user confirmation/editing
 * before submitting to ERPNext.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadERPNextConfig, savePendingExpense, generateId } from '../services/storage';
import { processReceiptImage } from '../services/ocr';
import {
  submitExpenseClaim,
  buildExpenseClaimPayload,
} from '../services/erpnext';
import { ExtractedReceipt, ERPNextConfig, ReceiptItem } from '../types';
import { mapReceiptToExpenseType } from '../utils/categoryMapper';
import { getTodayISO } from '../utils/dateParser';
import LineItemRow from '../components/LineItemRow';
import ConfidenceBar from '../components/ConfidenceBar';

type ReviewState =
  | { type: 'extracting' }
  | { type: 'error'; message: string }
  | { type: 'ready'; receipt: ExtractedReceipt }
  | { type: 'submitting' };

export default function ReviewScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [state, setState] = useState<ReviewState>({ type: 'extracting' });
  const [config, setConfig] = useState<ERPNextConfig | null>(null);

  // Editable fields (mirroring extracted receipt for live editing)
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [category, setCategory] = useState('');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    initializeScreen();
  }, [imageUri]);

  const initializeScreen = async () => {
    const cfg = await loadERPNextConfig();
    setConfig(cfg);

    if (!cfg?.googleVisionApiKey) {
      setState({
        type: 'error',
        message:
          'Google Vision API key is not configured. Please add it in Settings to enable OCR.',
      });
      return;
    }

    try {
      const extracted = await processReceiptImage(imageUri!, cfg.googleVisionApiKey);
      populateForm(extracted);
      setState({ type: 'ready', receipt: extracted });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to extract receipt data.';
      setState({ type: 'error', message });
    }
  };

  const populateForm = (receipt: ExtractedReceipt) => {
    setVendor(receipt.vendor);
    setDate(receipt.date);
    setTotalAmount(receipt.totalAmount > 0 ? receipt.totalAmount.toFixed(2) : '');
    setCategory(receipt.category);
    setItems(receipt.items);
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { description: '', amount: 0, expenseType: category || 'General' },
    ]);
  };

  const handleUpdateItem = (index: number, updated: ReceiptItem) => {
    setItems((prev) => prev.map((item, i) => (i === index ? updated : item)));
  };

  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const getValidationErrors = (): string[] => {
    const errors: string[] = [];
    if (!vendor.trim()) errors.push('Vendor name is required');
    if (!date.trim()) errors.push('Date is required');
    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount <= 0) errors.push('Amount must be greater than 0');
    if (items.length === 0) errors.push('At least one line item is required');
    return errors;
  };

  const buildSubmitReceipt = (): ExtractedReceipt => {
    const originalReceipt =
      state.type === 'ready' ? state.receipt : null;
    return {
      vendor: vendor.trim(),
      date: date.trim() || getTodayISO(),
      totalAmount: parseFloat(totalAmount) || 0,
      items,
      category: category || 'General',
      rawText: originalReceipt?.rawText || '',
      confidence: originalReceipt?.confidence || 0,
      imageUri: imageUri!,
    };
  };

  const handleSubmit = async () => {
    const errors = getValidationErrors();
    if (errors.length > 0) {
      Alert.alert('Missing Information', errors.join('\n'));
      return;
    }

    if (!config) {
      Alert.alert('Not Configured', 'ERPNext connection is not set up.');
      return;
    }

    setState({ type: 'submitting' });

    const receipt = buildSubmitReceipt();
    const payload = buildExpenseClaimPayload(receipt, config);

    try {
      const result = await submitExpenseClaim(payload, config);
      router.replace({
        pathname: '/confirm',
        params: {
          claimId: result.name,
          vendor: receipt.vendor,
          amount: receipt.totalAmount.toString(),
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Submission failed.';

      // Save to pending queue for retry
      const pending = {
        id: generateId(),
        extractedReceipt: receipt,
        payload,
        createdAt: new Date().toISOString(),
        status: 'failed' as const,
        errorMessage: message,
        retryCount: 0,
      };
      await savePendingExpense(pending);

      Alert.alert(
        'Submission Failed',
        `${message}\n\nThe expense has been saved locally and can be retried from the home screen.`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/'),
          },
        ],
      );
    }
  };

  const handleRetakePhoto = () => {
    router.back();
  };

  if (state.type === 'extracting') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.extractingTitle}>Analyzing Receipt</Text>
        <Text style={styles.extractingSubtitle}>
          Extracting vendor, amount, and date...
        </Text>
      </View>
    );
  }

  if (state.type === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Extraction Failed</Text>
        <Text style={styles.errorMessage}>{state.message}</Text>
        <TouchableOpacity style={styles.retakeButton} onPress={handleRetakePhoto}>
          <Text style={styles.retakeButtonText}>Retake Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsLink} onPress={() => router.push('/settings')}>
          <Text style={styles.settingsLinkText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (state.type === 'submitting') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.extractingTitle}>Submitting to ERPNext</Text>
        <Text style={styles.extractingSubtitle}>Creating expense claim...</Text>
      </View>
    );
  }

  const { receipt } = state;
  const validationErrors = getValidationErrors();
  const isValid = validationErrors.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Confidence indicator */}
          <View style={styles.card}>
            <ConfidenceBar confidence={receipt.confidence} />
            {receipt.confidence < 70 && (
              <View style={styles.retakePrompt}>
                <Text style={styles.retakePromptText}>
                  Low confidence detected. Consider retaking the photo with better lighting.
                </Text>
                <TouchableOpacity onPress={handleRetakePhoto}>
                  <Text style={styles.retakeLink}>Retake Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Receipt image preview toggle */}
          <TouchableOpacity
            style={styles.imageToggle}
            onPress={() => setShowImage((v) => !v)}
          >
            <Text style={styles.imageToggleText}>
              {showImage ? '▲ Hide receipt image' : '▼ Show receipt image'}
            </Text>
          </TouchableOpacity>
          {showImage && (
            <Image
              source={{ uri: imageUri }}
              style={styles.receiptImage}
              resizeMode="contain"
            />
          )}

          {/* Core fields */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Receipt Details</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Vendor *</Text>
              <TextInput
                style={[styles.fieldInput, !vendor.trim() && styles.fieldInputError]}
                value={vendor}
                onChangeText={setVendor}
                placeholder="Vendor name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Date *</Text>
              <TextInput
                style={[styles.fieldInput, !date.trim() && styles.fieldInputError]}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Total Amount *</Text>
              <View style={styles.amountField}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={[
                    styles.fieldInput,
                    styles.amountInput,
                    (!totalAmount || parseFloat(totalAmount) <= 0) && styles.fieldInputError,
                  ]}
                  value={totalAmount}
                  onChangeText={setTotalAmount}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Category</Text>
              <TextInput
                style={styles.fieldInput}
                value={category}
                onChangeText={setCategory}
                placeholder="e.g. Meals, Travel"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Line items */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Line Items</Text>
              <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
                <Text style={styles.addItemText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {items.length === 0 && (
              <Text style={styles.noItemsText}>
                No line items. Tap "+ Add" to add one, or the total amount will be used as a single item.
              </Text>
            )}
            {items.map((item, index) => (
              <LineItemRow
                key={index}
                item={item}
                index={index}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
              />
            ))}
          </View>

          {/* Validation errors */}
          {!isValid && (
            <View style={styles.validationErrors}>
              {validationErrors.map((err, i) => (
                <Text key={i} style={styles.validationErrorText}>
                  • {err}
                </Text>
              ))}
            </View>
          )}

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isValid}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Submit to ERPNext</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.retakeButtonBottom} onPress={handleRetakePhoto}>
            <Text style={styles.retakeButtonBottomText}>Retake Photo</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
  },
  extractingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  extractingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retakeButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginBottom: 12,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  settingsLink: {
    padding: 8,
  },
  settingsLinkText: {
    color: '#2563EB',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  retakePrompt: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  retakePromptText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
  },
  retakeLink: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  imageToggle: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  imageToggleText: {
    fontSize: 13,
    color: '#6B7280',
  },
  receiptImage: {
    width: '100%',
    height: 240,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#E5E7EB',
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
  },
  fieldInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
  },
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  addItemButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  addItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  noItemsText: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    textAlign: 'center',
    paddingVertical: 8,
  },
  validationErrors: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  validationErrorText: {
    fontSize: 13,
    color: '#DC2626',
    marginBottom: 2,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  retakeButtonBottom: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  retakeButtonBottomText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
