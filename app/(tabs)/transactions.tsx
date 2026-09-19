import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, SectionList, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getFilteredTransactions, deleteTransaction } from '../../db/queries';
import { Transaction } from '../../db/schema';
import TransactionListItem from '../../components/TransactionListItem';
import { CATEGORIES } from '../../utils/categories';

import { theme } from '../../components/theme';

// Date utility helpers
const getRelativeDateLabel = (dateStr: string) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';
  return dateStr;
};

// Simple date offset helper for filters
const getStartDate = (range: string) => {
  const date = new Date();
  if (range === '7D') {
    date.setDate(date.getDate() - 7);
  } else if (range === '30D') {
    date.setDate(date.getDate() - 30);
  } else if (range === '1Y') {
    date.setFullYear(date.getFullYear() - 1);
  } else {
    return undefined; // All time
  }
  return date.toISOString().split('T')[0];
};

const DATE_RANGES = ['All Time', '7D', '30D', '1Y'];
const CATEGORY_OPTIONS = ['All', ...CATEGORIES];

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [dateRange, setDateRange] = useState('All Time');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const startDate = getStartDate(dateRange);
      const category = selectedCategory !== 'All' ? selectedCategory : undefined;
      
      const data = await getFilteredTransactions({ category, startDate });
      setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [dateRange, selectedCategory])
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      loadData(); // refresh list
    } catch (error) {
      console.error(error);
    }
  };

  // Group transactions by date for SectionList
  const groupedData = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    transactions.forEach(tx => {
      if (!groups[tx.date]) {
        groups[tx.date] = [];
      }
      groups[tx.date].push(tx);
    });

    // Convert to SectionList format and sort sections by date descending
    return Object.keys(groups)
      .sort((a, b) => (a < b ? 1 : -1))
      .map(date => ({
        title: getRelativeDateLabel(date),
        data: groups[date],
      }));
  }, [transactions]);

  return (
    <View className="flex-1 bg-background">
      {/* Header Filters */}
      <View className="pt-4 pb-2 bg-surface rounded-b-3xl mb-4 shadow-lg">
        {/* Date Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 px-4">
          {DATE_RANGES.map(range => (
            <Pressable
              key={range}
              className={`px-5 py-2.5 rounded-full mr-3 ${dateRange === range ? 'bg-primary' : 'bg-border'}`}
              onPress={() => setDateRange(range)}
            >
              <Text className={`font-manrope-bold ${dateRange === range ? 'text-primaryForeground' : 'text-textMuted'}`}>
                {range}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
          {CATEGORY_OPTIONS.map(cat => (
            <Pressable
              key={cat}
              className={`px-5 py-2.5 rounded-full mr-3 ${selectedCategory === cat ? 'bg-primary' : 'bg-border'}`}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text className={`font-manrope-bold ${selectedCategory === cat ? 'text-primaryForeground' : 'text-textMuted'}`}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Transactions List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : groupedData.length === 0 ? (
        <View className="flex-1 justify-center items-center p-8">
          <Text className="text-text font-fraunces-bold text-xl mb-2">No transactions found</Text>
          <Text className="text-textMuted font-manrope text-center">
            Try adjusting your filters or add a new transaction.
          </Text>
        </View>
      ) : (
        <SectionList
          className="px-4"
          sections={groupedData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionListItem transaction={item} onDelete={handleDelete} />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View className="py-3 mt-4 mb-2">
              <Text className="text-text text-lg font-fraunces-bold tracking-wide">{title}</Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
}
