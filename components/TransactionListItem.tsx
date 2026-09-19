import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../db/schema';
import { getCategoryIcon } from '../utils/categories';
import { theme } from './theme';

interface Props {
  transaction: Transaction;
  onDelete?: (id: string) => void;
}

export default function TransactionListItem({ transaction, onDelete }: Props) {
  const router = useRouter();

  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? 'text-success' : 'text-text';
  const sign = isIncome ? '+' : '-';
  const iconName = getCategoryIcon(transaction.category) as keyof typeof Ionicons.glyphMap;

  const handleLongPress = () => {
    Alert.alert(
      'Transaction Options',
      'Choose an action',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => router.push({ pathname: '/add', params: { id: transaction.id } }) },
        { text: 'Delete', onPress: () => onDelete && onDelete(transaction.id), style: 'destructive' },
      ]
    );
  };

  return (
    <Pressable 
      className="flex-row justify-between items-center py-3 px-4 mb-3 bg-surface rounded-2xl"
      onPress={() => router.push({ pathname: '/add', params: { id: transaction.id } })}
      onLongPress={handleLongPress}
    >
      <View className="flex-row items-center">
        {/* Icon Circle */}
        <View className="w-12 h-12 rounded-full bg-border items-center justify-center mr-4">
          <Ionicons name={iconName} size={24} color={theme.colors.text} />
        </View>

        <View>
          <Text className="text-text font-manrope-bold text-lg">{transaction.category}</Text>
          <Text className="text-textMuted font-manrope text-sm">{transaction.date}</Text>
        </View>
      </View>
      <Text 
        className={`font-fraunces-bold text-lg ${amountColor}`}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {sign}${transaction.amount.toFixed(2)}
      </Text>
    </Pressable>
  );
}
