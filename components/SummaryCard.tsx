import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from './theme';

interface SummaryCardProps {
  title: string;
  amount: number;
  valueColor?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  isMain?: boolean;
}

export default function SummaryCard({ title, amount, valueColor, iconName, isMain }: SummaryCardProps) {
  if (isMain) {
    return (
      <View className="bg-primary rounded-3xl p-8 mb-4 items-center justify-center w-full shadow-2xl shadow-primary/50 border border-white/10">
        <Text className="text-primaryForeground opacity-80 text-xs uppercase mb-3 font-manrope-bold tracking-widest">{title}</Text>
        <Text 
          className="text-6xl font-fraunces-bold text-primaryForeground" 
          style={{ fontVariant: ['tabular-nums'] }}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          ${amount.toFixed(2)}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface rounded-3xl p-4 mx-1 mb-4">
      <View className="flex-row items-center mb-3">
        {iconName && (
          <View className="w-8 h-8 rounded-full bg-border items-center justify-center mr-2">
            <Ionicons name={iconName} size={16} color={valueColor || theme.colors.text} />
          </View>
        )}
        <Text className="text-textMuted text-xs uppercase font-manrope-bold">{title}</Text>
      </View>
      <Text 
        className="text-2xl font-fraunces-bold" 
        style={{ color: valueColor || theme.colors.text, fontVariant: ['tabular-nums'] }}
      >
        ${amount.toFixed(2)}
      </Text>
    </View>
  );
}
