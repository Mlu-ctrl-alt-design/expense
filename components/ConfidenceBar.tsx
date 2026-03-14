/**
 * Visual indicator for OCR confidence score.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ConfidenceBarProps {
  confidence: number; // 0-100
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return '#10B981'; // green
  if (confidence >= 60) return '#F59E0B'; // amber
  return '#EF4444'; // red
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 80) return 'High confidence';
  if (confidence >= 60) return 'Medium confidence – review carefully';
  return 'Low confidence – please verify all fields';
}

export default function ConfidenceBar({ confidence }: ConfidenceBarProps) {
  const color = getConfidenceColor(confidence);
  const label = getConfidenceLabel(confidence);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>OCR Quality</Text>
        <Text style={[styles.score, { color }]}>{confidence}%</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${confidence}%` as any, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.hint, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
  },
  score: {
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  hint: {
    fontSize: 11,
    marginTop: 4,
  },
});
