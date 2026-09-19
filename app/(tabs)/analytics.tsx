import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedProps, withSpring, withDelay, FadeInDown, ZoomIn, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { getMonthlySummary, getExpensesByCategory, getAllTransactions } from '../../db/queries';
import { theme } from '../../components/theme';

// Safely import and configure expo-notifications
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
} catch (e) {
  console.log('expo-notifications not available');
}

// Custom Animated Vertical Bar
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const AnimatedLineChart = ({ data, color, maxValue, delay }: { data: number[], color: string, maxValue: number, delay: number }) => {
  const chartWidth = Dimensions.get('window').width - 80; // p-6 is 24px each side (48) + p-4 is 16px (32) = 80
  const chartHeight = 150;
  const padding = 10;
  const usableWidth = chartWidth - padding * 2;
  const usableHeight = chartHeight - padding * 2;

  // Generate points
  const points = data.map((val, i) => {
    const x = padding + (i * usableWidth) / (data.length - 1 || 1);
    const y = chartHeight - padding - (maxValue > 0 ? (val / maxValue) * usableHeight : 0);
    return { x, y };
  });

  // Generate smooth cubic bezier path
  let path = '';
  if (points.length > 0) {
    path = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const midX = (p1.x + p2.x) / 2;
      path += ` C ${midX},${p1.y} ${midX},${p2.y} ${p2.x},${p2.y}`;
    }
  }

  // Animation logic
  const fillOpacity = useSharedValue(0);
  const lineOpacity = useSharedValue(0);

  useEffect(() => {
    lineOpacity.value = withDelay(delay, withTiming(1, { duration: 1000 }));
    fillOpacity.value = withDelay(delay + 300, withTiming(0.2, { duration: 1000 }));
  }, []);

  const animatedFillProps = useAnimatedProps(() => ({
    opacity: fillOpacity.value,
  }));

  const animatedLineProps = useAnimatedProps(() => ({
    opacity: lineOpacity.value,
  }));

  // Create closed path for gradient fill
  const fillPath = points.length > 0 
    ? `${path} L ${points[points.length - 1].x},${chartHeight} L ${points[0].x},${chartHeight} Z`
    : '';

  const gradientId = `grad_${color.replace('#', '')}`;

  return (
    <View style={{ position: 'absolute', width: chartWidth, height: chartHeight, paddingHorizontal: padding, bottom: 0 }}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        
        {/* Fill Area */}
        {points.length > 0 && (
          <AnimatedPath
            d={fillPath}
            fill={`url(#${gradientId})`}
            stroke="none"
            animatedProps={animatedFillProps}
          />
        )}

        {/* Smooth Line */}
        <AnimatedPath
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          animatedProps={animatedLineProps}
        />

        {/* Data Points */}
        {points.map((p, i) => {
          const scale = useSharedValue(0);
          useEffect(() => {
            scale.value = withDelay(delay + 800 + (i * 100), withSpring(1, { damping: 12 }));
          }, []);
          const animatedCircleProps = useAnimatedProps(() => ({ r: 5 * scale.value }));
          
          return (
            <AnimatedCircle
              key={i}
              cx={p.x}
              cy={p.y}
              fill={color}
              stroke="#1E1E1E"
              strokeWidth={3}
              animatedProps={animatedCircleProps}
            />
          );
        })}
      </Svg>
    </View>
  );
};

// Custom Animated Horizontal Segment (for categories)
const AnimatedSegment = ({ percentage, color, delay }: { percentage: number, color: string, delay: number }) => {
  const flexProgress = useSharedValue(0);

  useEffect(() => {
    flexProgress.value = withDelay(delay, withSpring(percentage, { damping: 15, stiffness: 100 }));
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    flex: flexProgress.value,
  }));

  return (
    <Animated.View style={[animatedStyle, { backgroundColor: color, height: '100%' }]} />
  );
};

// Static color palette for categories
const CATEGORY_COLORS = [
  '#FFFFFF', // White
  '#D4D4D4', // Light Gray
  '#A3A3A3', // Gray
  '#737373', // Dark Gray
  '#525252', // Darker Gray
  '#404040', // Very Dark Gray
];

export default function AnalyticsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [budget, setBudget] = useState('');
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState(0);

  const getCurrentMonthStr = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${month}`;
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const currentMonth = getCurrentMonthStr();
      const [monthly, category, savedBudget] = await Promise.all([
        getMonthlySummary(),
        getExpensesByCategory(currentMonth),
        SecureStore.getItemAsync('budget')
      ]);

      if (savedBudget) setBudget(savedBudget);
      // Generate the last 6 months timeline
      const paddedMonthly = [];
      const d = new Date();
      for (let i = 5; i >= 0; i--) {
        const temp = new Date(d.getFullYear(), d.getMonth() - i, 1);
        const monthStr = `${temp.getFullYear()}-${String(temp.getMonth() + 1).padStart(2, '0')}`;
        const existing = monthly.find(m => m.month === monthStr);
        if (existing) {
          paddedMonthly.push(existing);
        } else {
          paddedMonthly.push({ month: monthStr, income: 0, expense: 0, balance: 0 });
        }
      }

      setMonthlyData(paddedMonthly);
      setCategoryData(category);
      
      const totalExp = category.reduce((sum, item) => sum + item.total, 0);
      setCurrentMonthExpenses(totalExp);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleSaveBudget = async () => {
    await SecureStore.setItemAsync('budget', budget);
    Alert.alert('Success', 'Budget saved!');
    loadData();
  };

  const handleExportPDF = async () => {
    try {
      const transactions = await getAllTransactions();
      let tableRows = '';
      transactions.forEach(t => {
        const isIncome = t.type === 'income';
        tableRows += `<tr>
          <td>${t.date}</td>
          <td>${t.category}</td>
          <td>${t.note || '-'}</td>
          <td style="color: ${isIncome ? 'green' : 'red'}">${isIncome ? '+' : '-'}$${t.amount.toFixed(2)}</td>
        </tr>`;
      });

      const html = `
        <html>
          <head>
            <style>
              body { font-family: sans-serif; padding: 20px; color: #333; }
              h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .summary { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
            </style>
          </head>
          <body>
            <h1>Expense Report</h1>
            <div class="summary">
              <h3>Summary for ${getCurrentMonthStr()}</h3>
              <p><strong>Total Expenses:</strong> $${currentMonthExpenses.toFixed(2)}</p>
              <p><strong>Budget:</strong> $${budget || 'Not set'}</p>
            </div>
            <table>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Note</th>
                <th>Amount</th>
              </tr>
              ${tableRows}
            </table>
          </body>
        </html>
      `;

      const { base64 } = await Print.printToFileAsync({ html, base64: true });
      const newUri = FileSystem.documentDirectory + 'ExpenseReport.pdf';
      await FileSystem.writeAsStringAsync(newUri, base64 || '', { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const isOverBudget = budget && parseFloat(budget) > 0 && currentMonthExpenses > parseFloat(budget);

  // Find max value to scale the bar chart
  const maxBarValue = Math.max(
    100, // minimum scale
    ...monthlyData.flatMap(d => [d.income, d.expense])
  );

  return (
    <ScrollView className="flex-1 bg-background p-4" showsVerticalScrollIndicator={false}>
      
      {/* Budget Banner */}
      {isOverBudget ? (
        <View className="bg-danger/20 p-4 rounded-2xl mb-6 shadow-sm border border-danger/50">
          <Text className="text-danger font-manrope-bold text-center">⚠️ Warning: You have exceeded your monthly budget!</Text>
        </View>
      ) : null}

      {/* Set Budget */}
      <View className="mb-8 bg-surface p-6 rounded-3xl shadow-sm">
        <Text className="text-textMuted font-manrope mb-4 ml-1">Set Monthly Budget</Text>
        <View className="flex-row items-center">
          <TextInput 
            className="flex-1 text-text pb-2 font-fraunces-bold text-3xl border-b border-border mr-4"
            placeholder="0.00"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="numeric"
            value={budget}
            onChangeText={setBudget}
            style={{ fontVariant: ['tabular-nums'] }}
          />
          <Pressable className="bg-primary px-6 py-3 rounded-full shadow-lg shadow-primary/30" onPress={handleSaveBudget}>
            <Text className="text-primaryForeground font-manrope-bold">Save</Text>
          </Pressable>
        </View>
      </View>

      {/* Custom FamPay Style Bar Chart */}
      <View>
        <Text className="text-text font-fraunces-bold text-xl mb-4 ml-1">Cashflow</Text>
        <View className="mb-8 bg-surface p-6 rounded-3xl shadow-sm h-64 justify-between">
          
          {monthlyData.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <Text className="text-textMuted font-manrope">No data available yet</Text>
            </View>
          ) : (
            <View className="flex-1 justify-end h-[150px] relative w-full items-center">
              {/* Animated Background Line Charts */}
              <AnimatedLineChart data={monthlyData.map(d => d.expense)} color={theme.colors.danger} maxValue={maxBarValue} delay={100} />
              <AnimatedLineChart data={monthlyData.map(d => d.income)} color={theme.colors.success} maxValue={maxBarValue} delay={300} />
              
              {/* Month Labels overlay */}
              <View className="flex-row justify-between w-full absolute bottom-[-24px] px-2">
                {monthlyData.map(data => (
                  <Text key={data.month} className="text-textMuted text-xs font-manrope-bold mt-1">
                    {new Date(data.month + '-01').toLocaleString('default', { month: 'short' })}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Legend */}
          <View className="flex-row justify-center gap-8 mt-10">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-success mr-2" />
              <Text className="text-textMuted font-manrope-bold text-xs">Income</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-danger mr-2" />
              <Text className="text-textMuted font-manrope-bold text-xs">Expense</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Custom FamPay Style Horizontal Progress Chart */}
      <View>
        <Text className="text-text font-fraunces-bold text-xl mb-4 ml-1">Spend by Category</Text>
        <View className="mb-8 bg-surface p-6 rounded-3xl shadow-sm">
          {categoryData.length > 0 ? (
            <>
              {/* Animated Progress Bar */}
              <View className="h-4 flex-row rounded-full overflow-hidden mb-6 bg-border/30">
                {categoryData.map((cat, idx) => (
                  <AnimatedSegment 
                    key={cat.category} 
                    percentage={cat.total / currentMonthExpenses} 
                    color={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} 
                    delay={600 + (idx * 150)} 
                  />
                ))}
              </View>

              {/* Data List */}
              <View className="space-y-4">
                {categoryData.map((cat, idx) => {
                  const percent = Math.round((cat.total / currentMonthExpenses) * 100);
                  return (
                    <View key={cat.category} className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <View style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} className="w-4 h-4 rounded-full shadow-sm" />
                        <Text className="text-text font-manrope-bold">{cat.category}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-text font-fraunces-bold text-lg">${cat.total.toFixed(2)}</Text>
                        <Text className="text-textMuted text-xs font-manrope mt-1">{percent}%</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <Text className="text-textMuted font-manrope text-center py-4">No expenses recorded this month.</Text>
          )}
        </View>
      </View>

      {/* Export Button */}
      <View>
        <Pressable 
          className="bg-primary p-4 rounded-full items-center mb-10 shadow-lg shadow-primary/30 mx-1"
          onPress={handleExportPDF}
        >
          <Text className="text-primaryForeground font-manrope-bold text-lg">Export Report as PDF</Text>
        </Pressable>
      </View>

    </ScrollView>
  );
}
