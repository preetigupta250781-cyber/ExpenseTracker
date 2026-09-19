import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getSummary, getAllTransactions } from '../../db/queries';
import { Transaction } from '../../db/schema';
import SummaryCard from '../../components/SummaryCard';
import TransactionListItem from '../../components/TransactionListItem';

import { theme } from '../../components/theme';

export default function DashboardScreen() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadData = async () => {
        try {
          setIsLoading(true);
          const [sum, allTx] = await Promise.all([
            getSummary(),
            getAllTransactions()
          ]);
          
          if (isActive) {
            setSummary(sum);
            setRecentTransactions(allTx.slice(0, 5));
          }
        } catch (error) {
          console.error("Failed to load dashboard data", error);
        } finally {
          if (isActive) setIsLoading(false);
        }
      };

      loadData();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Greeting Header */}
        <View className="mb-6 mt-4 px-2">
          <Text className="text-textMuted font-manrope text-lg">Good Morning,</Text>
          <Text className="text-text font-fraunces-bold text-3xl">Money Maker</Text>
        </View>

        {/* Main Balance Card */}
        <View className="px-1">
          <SummaryCard 
            title="Total Balance" 
            amount={Math.abs(summary.balance)} 
            isMain 
          />
        </View>

        {/* Bento Grid - Income & Expense */}
        <View className="flex-row justify-between mb-8 px-1">
          <View className="flex-1">
            <SummaryCard 
              title="Income" 
              amount={summary.totalIncome} 
              valueColor={theme.colors.success} 
              iconName="arrow-down-outline" 
            />
          </View>
          <View className="flex-1">
            <SummaryCard 
              title="Expense" 
              amount={summary.totalExpense} 
              valueColor={theme.colors.danger} 
              iconName="arrow-up-outline" 
            />
          </View>
        </View>

        {/* Recent Transactions Section */}
        <View className="flex-row justify-between items-end mb-4 px-2">
          <Text className="text-text text-xl font-fraunces-bold">Recent Activity</Text>
          {recentTransactions.length > 0 && (
            <Pressable onPress={() => router.push('/(tabs)/transactions')} className="bg-surface px-4 py-1.5 rounded-full">
              <Text className="text-textMuted font-manrope-bold text-xs uppercase tracking-wider">See All</Text>
            </Pressable>
          )}
        </View>

        {recentTransactions.length === 0 ? (
          <View className="p-8 items-center justify-center mt-4 bg-surface rounded-3xl mx-1 border border-border border-dashed">
            <Text className="text-text text-lg font-fraunces-bold mb-2">No transactions yet!</Text>
            <Text className="text-textMuted text-center mb-6 font-manrope">
              Track your spending and income easily. Add your first transaction now.
            </Text>
            <Pressable 
              className="bg-primary px-6 py-3 rounded-full"
              onPress={() => router.push('/add')}
            >
              <Text className="text-primaryForeground font-manrope-bold">+ Add Transaction</Text>
            </Pressable>
          </View>
        ) : (
          <View className="mb-20 px-1">
            {recentTransactions.map((tx, index) => (
              <View key={tx.id}>
                <TransactionListItem transaction={tx} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View className="flex-1 bg-background p-4">
      {renderContent()}

      {/* Floating Action Button */}
      <View className="absolute bottom-6 right-6 z-50">
        <Pressable
          className="w-16 h-16 bg-primary rounded-full items-center justify-center shadow-xl shadow-primary/30"
          onPress={() => router.push('/add')}
        >
          <Text className="text-primaryForeground font-fraunces-bold text-4xl mb-1">+</Text>
        </Pressable>
      </View>
    </View>
  );
}
