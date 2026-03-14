/**
 * Editable line item row for the expense review form.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ReceiptItem } from '../types';
import { DEFAULT_EXPENSE_TYPES } from '../utils/categoryMapper';

interface LineItemRowProps {
  item: ReceiptItem;
  index: number;
  onUpdate: (index: number, updated: ReceiptItem) => void;
  onDelete: (index: number) => void;
}

export default function LineItemRow({
  item,
  index,
  onUpdate,
  onDelete,
}: LineItemRowProps) {
  const [showTypePicker, setShowTypePicker] = useState(false);

  const handleDescriptionChange = (text: string) => {
    onUpdate(index, { ...item, description: text });
  };

  const handleAmountChange = (text: string) => {
    const amount = parseFloat(text.replace(/[^0-9.]/g, ''));
    onUpdate(index, { ...item, amount: isNaN(amount) ? 0 : amount });
  };

  const handleTypeSelect = (type: string) => {
    onUpdate(index, { ...item, expenseType: type });
    setShowTypePicker(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          style={styles.descriptionInput}
          value={item.description}
          onChangeText={handleDescriptionChange}
          placeholder="Description"
          placeholderTextColor="#9CA3AF"
        />
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={item.amount > 0 ? item.amount.toFixed(2) : ''}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(index)}
        >
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.typeSelector}
        onPress={() => setShowTypePicker(!showTypePicker)}
      >
        <Text style={styles.typeLabel}>{item.expenseType}</Text>
        <Text style={styles.chevron}>{showTypePicker ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {showTypePicker && (
        <View style={styles.typePicker}>
          {DEFAULT_EXPENSE_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeOption,
                item.expenseType === type && styles.typeOptionSelected,
              ]}
              onPress={() => handleTypeSelect(type)}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  item.expenseType === type && styles.typeOptionTextSelected,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  descriptionInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 4,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    minWidth: 80,
  },
  currencySymbol: {
    fontSize: 14,
    color: '#374151',
    marginRight: 2,
  },
  amountInput: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 60,
    paddingVertical: 4,
  },
  deleteButton: {
    marginLeft: 10,
    padding: 4,
  },
  deleteIcon: {
    fontSize: 14,
    color: '#EF4444',
  },
  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  typeLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  chevron: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  typePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 6,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  typeOption: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeOptionSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeOptionText: {
    fontSize: 12,
    color: '#374151',
  },
  typeOptionTextSelected: {
    color: '#fff',
  },
});
