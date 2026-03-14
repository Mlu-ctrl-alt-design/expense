/**
 * Settings screen: ERPNext connection configuration and API keys.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ERPNextConfig } from '../types';
import {
  loadERPNextConfig,
  saveERPNextConfig,
  clearERPNextConfig,
} from '../services/storage';
import { testERPNextConnection } from '../services/erpnext';

type ConnectionStatus =
  | { type: 'idle' }
  | { type: 'testing' }
  | { type: 'success'; employeeName: string }
  | { type: 'error'; message: string };

export default function SettingsScreen() {
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [company, setCompany] = useState('');
  const [googleVisionApiKey, setGoogleVisionApiKey] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ type: 'idle' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const config = await loadERPNextConfig();
    if (config) {
      setBaseUrl(config.baseUrl);
      setApiKey(config.apiKey);
      setApiSecret(config.apiSecret);
      setEmployeeId(config.employeeId);
      setCompany(config.company);
      setGoogleVisionApiKey(config.googleVisionApiKey || '');
    }
  };

  const normalizeUrl = (url: string): string => {
    let normalized = url.trim();
    if (normalized && !normalized.startsWith('http')) {
      normalized = `https://${normalized}`;
    }
    return normalized.replace(/\/$/, '');
  };

  const buildConfig = (): ERPNextConfig => ({
    baseUrl: normalizeUrl(baseUrl),
    apiKey: apiKey.trim(),
    apiSecret: apiSecret.trim(),
    employeeId: employeeId.trim(),
    company: company.trim(),
    googleVisionApiKey: googleVisionApiKey.trim() || undefined,
  });

  const validateConfig = (): string[] => {
    const errors: string[] = [];
    if (!baseUrl.trim()) errors.push('ERPNext URL is required');
    if (!apiKey.trim()) errors.push('API Key is required');
    if (!apiSecret.trim()) errors.push('API Secret is required');
    if (!employeeId.trim()) errors.push('Employee ID is required');
    if (!company.trim()) errors.push('Company name is required');
    return errors;
  };

  const handleTestConnection = async () => {
    const errors = validateConfig();
    if (errors.length > 0) {
      Alert.alert('Missing Fields', errors.join('\n'));
      return;
    }

    setConnectionStatus({ type: 'testing' });
    const result = await testERPNextConnection(buildConfig());

    if (result.success) {
      setConnectionStatus({
        type: 'success',
        employeeName: result.employeeName || employeeId,
      });
    } else {
      setConnectionStatus({
        type: 'error',
        message: result.error || 'Connection failed',
      });
    }
  };

  const handleSave = async () => {
    const errors = validateConfig();
    if (errors.length > 0) {
      Alert.alert('Missing Fields', errors.join('\n'));
      return;
    }

    setIsSaving(true);
    try {
      await saveERPNextConfig(buildConfig());
      Alert.alert('Saved', 'Configuration saved successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Configuration',
      'This will remove all saved ERPNext credentials. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearERPNextConfig();
            setBaseUrl('');
            setApiKey('');
            setApiSecret('');
            setEmployeeId('');
            setCompany('');
            setGoogleVisionApiKey('');
            setConnectionStatus({ type: 'idle' });
          },
        },
      ],
    );
  };

  const renderConnectionStatus = () => {
    if (connectionStatus.type === 'idle') return null;
    if (connectionStatus.type === 'testing') {
      return (
        <View style={styles.statusBox}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.statusText}>Testing connection...</Text>
        </View>
      );
    }
    if (connectionStatus.type === 'success') {
      return (
        <View style={[styles.statusBox, styles.statusSuccess]}>
          <Text style={styles.statusIcon}>✓</Text>
          <Text style={[styles.statusText, styles.statusTextSuccess]}>
            Connected as {connectionStatus.employeeName}
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBox, styles.statusError]}>
        <Text style={styles.statusIcon}>✕</Text>
        <Text style={[styles.statusText, styles.statusTextError]}>
          {connectionStatus.message}
        </Text>
      </View>
    );
  };

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
          {/* ERPNext Connection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ERPNext Connection</Text>
            <Text style={styles.sectionSubtitle}>
              Enter your ERPNext instance details and API credentials.
            </Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>ERPNext URL *</Text>
              <TextInput
                style={styles.fieldInput}
                value={baseUrl}
                onChangeText={setBaseUrl}
                placeholder="https://yoursite.erpnext.com"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>API Key *</Text>
              <TextInput
                style={styles.fieldInput}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="Your ERPNext API key"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showSecrets}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>API Secret *</Text>
              <TextInput
                style={styles.fieldInput}
                value={apiSecret}
                onChangeText={setApiSecret}
                placeholder="Your ERPNext API secret"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showSecrets}
              />
            </View>

            <View style={styles.showSecretsRow}>
              <Text style={styles.showSecretsLabel}>Show API credentials</Text>
              <Switch
                value={showSecrets}
                onValueChange={setShowSecrets}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={showSecrets ? '#2563EB' : '#fff'}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Employee ID *</Text>
              <TextInput
                style={styles.fieldInput}
                value={employeeId}
                onChangeText={setEmployeeId}
                placeholder="e.g. HR-EMP-00001"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Company *</Text>
              <TextInput
                style={styles.fieldInput}
                value={company}
                onChangeText={setCompany}
                placeholder="Your company name in ERPNext"
                placeholderTextColor="#9CA3AF"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Test connection */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestConnection}
            disabled={connectionStatus.type === 'testing'}
          >
            <Text style={styles.testButtonText}>Test Connection</Text>
          </TouchableOpacity>

          {renderConnectionStatus()}

          {/* OCR Configuration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OCR Configuration</Text>
            <Text style={styles.sectionSubtitle}>
              Required for automatic receipt text extraction. Get a key from
              Google Cloud Console → Vision API.
            </Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Google Vision API Key</Text>
              <TextInput
                style={styles.fieldInput}
                value={googleVisionApiKey}
                onChangeText={setGoogleVisionApiKey}
                placeholder="AIza..."
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showSecrets}
              />
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Without an OCR key, you can still manually enter receipt
                details after scanning.
              </Text>
            </View>
          </View>

          {/* How to get credentials */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to get API credentials</Text>
            <Text style={styles.instructionText}>
              1. Log into your ERPNext instance as Administrator{'\n'}
              2. Go to Settings → API Access → Generate Keys{'\n'}
              3. Select your user and generate API key + secret{'\n'}
              4. Copy both values into the fields above{'\n'}
              5. Find your Employee ID in HR → Employee records
            </Text>
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Configuration</Text>
            )}
          </TouchableOpacity>

          {/* Clear configuration */}
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Clear All Credentials</Text>
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
    paddingBottom: 48,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 14,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
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
  showSecretsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  showSecretsLabel: {
    fontSize: 14,
    color: '#374151',
  },
  testButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  statusSuccess: {
    backgroundColor: '#ECFDF5',
  },
  statusError: {
    backgroundColor: '#FEF2F2',
  },
  statusIcon: {
    fontSize: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  statusTextSuccess: {
    color: '#065F46',
    fontWeight: '600',
  },
  statusTextError: {
    color: '#DC2626',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#1D4ED8',
    lineHeight: 18,
  },
  instructionText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  saveButton: {
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
  saveButtonDisabled: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#EF4444',
  },
});
