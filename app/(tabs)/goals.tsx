import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withSpring, withDelay } from 'react-native-reanimated';
import { Goal } from '../../db/schema';
import { getGoals, createGoal, addFundsToGoal, deleteGoal } from '../../db/queries';
import { theme } from '../../components/theme';



// Original animated emoji coin
const AnimatedCoin = ({ item, isVisible }: { item: any, isVisible: boolean }) => {
  const translateY = useSharedValue(isVisible ? 0 : -300);
  const opacity = useSharedValue(isVisible ? 1 : 0);
  const wasVisible = React.useRef(isVisible);

  useEffect(() => {
    if (isVisible && !wasVisible.current) {
      const delay = Math.random() * 800;
      opacity.value = withDelay(delay, withTiming(1, { duration: 100 }));
      translateY.value = withDelay(delay, withSpring(0, { damping: 12, stiffness: 90 }));
    } else if (isVisible && wasVisible.current) {
      opacity.value = 1;
      translateY.value = 0;
    } else {
      opacity.value = 0;
      translateY.value = -300;
    }
    wasVisible.current = isVisible;
  }, [isVisible]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { rotate: item.rotation }
    ]
  }));

  return (
    <Animated.Text style={[{ position: 'absolute', left: item.left as any, bottom: item.bottom as any, fontSize: item.size }, style]}>
      {item.icon}
    </Animated.Text>
  );
};

// The visual "Jar" component
const SavingsJar = ({ goal, onAddFunds, onDelete }: { goal: Goal, onAddFunds: () => void, onDelete: (id: string) => void }) => {
  const percentage = goal.target_amount > 0 
    ? Math.min(100, Math.max(0, ((goal.current_amount || 0) / goal.target_amount) * 100)) 
    : 0;
  
  const scale = useSharedValue(1);

  // Generate a random pile of money for this jar
  const moneyPile = useMemo(() => {
    const icons = ['🪙', '💵', '💰', '💎'];
    // Capping at 50 to preserve the dense look while maintaining frame rates
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      icon: icons[Math.floor(Math.random() * icons.length)],
      left: `${Math.random() * 85}%`,
      bottom: `${Math.random() * 95}%`,
      rotation: `${Math.random() * 360}deg`,
      size: Math.random() * 12 + 18, // 18px to 30px
    })).sort((a, b) => parseFloat(a.bottom) - parseFloat(b.bottom)); // Sort by bottom to fill bottom-up
  }, []);

  const visibleCount = Math.floor((percentage / 100) * moneyPile.length);

  // Background tint height (using precise pixels since jar is 192px tall)
  const bgHeight = useSharedValue(0);
  useEffect(() => {
    bgHeight.value = withTiming((percentage / 100) * 192, { duration: 1000, easing: Easing.out(Easing.exp) });
    if (percentage >= 100) {
      scale.value = withSpring(1.05, { damping: 2, stiffness: 80 }, () => {
        scale.value = withSpring(1);
      });
    }
  }, [percentage]);

  const animatedBgStyle = useAnimatedStyle(() => {
    return { height: bgHeight.value };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const isComplete = percentage >= 100;

  return (
    <Animated.View style={animatedContainerStyle} className="mb-8 bg-surface rounded-[40px] p-6 shadow-sm items-center">
      <View className="flex-row w-full justify-between items-center mb-6 px-2">
        <Text className="text-text font-fraunces-bold text-xl">{goal.name}</Text>
        <Pressable onPress={() => {
          Alert.alert('Delete Goal', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(goal.id as string) }
          ]);
        }} className="p-2 bg-danger/20 rounded-full">
          <Text className="text-danger font-manrope-bold text-xs uppercase tracking-wider">Delete</Text>
        </Pressable>
      </View>
      
      <View className="items-center mb-4 relative w-full">
        <View className="w-24 h-6 rounded-full border-4 border-border absolute -top-3 z-10 bg-background" />
        
        {/* Jar Body */}
        <View className="w-40 h-48 bg-background rounded-[50px] border-4 border-border overflow-hidden relative items-center justify-end shadow-inner">
          
          {/* Smooth Solid Fill */}
          <Animated.View 
            style={[{ width: '100%', position: 'absolute', bottom: 0 }, animatedBgStyle]} 
            className={isComplete ? 'bg-primary' : 'bg-primary/20'}
          />

          {/* Falling Coins! */}
          {moneyPile.map((item, index) => (
            <AnimatedCoin key={item.id} item={item} isVisible={index < visibleCount} />
          ))}

          {/* Percentage Text Centered */}
          <View className="absolute inset-0 items-center justify-center z-20" pointerEvents="none">
            <Text className="text-text font-fraunces-bold text-4xl" style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 10 }}>
              {percentage.toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row w-full justify-between mt-2 mb-6 px-2">
        <Text className="text-text font-manrope-bold text-lg" style={{ fontVariant: ['tabular-nums'] }}>${goal.current_amount}</Text>
        <Text className="text-textMuted font-manrope-bold text-lg" style={{ fontVariant: ['tabular-nums'] }}>Goal: ${goal.target_amount}</Text>
      </View>

      {percentage < 100 ? (
        <Pressable 
          className="bg-primary w-full py-4 rounded-full items-center shadow-lg shadow-primary/30"
          onPress={onAddFunds}
        >
          <Text className="text-primaryForeground font-manrope-bold text-lg">+ Add Funds</Text>
        </Pressable>
      ) : (
        <View className="bg-success w-full py-4 rounded-full items-center shadow-lg shadow-success/30">
          <Text className="text-background font-manrope-bold text-lg">Goal Reached! 🎉</Text>
        </View>
      )}
    </Animated.View>
  );
};

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');

  const [fundsModalVisible, setFundsModalVisible] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState('');

  const loadGoals = async () => {
    try {
      const data = await getGoals();
      setGoals(data);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [])
  );

  const handleCreateGoal = async () => {
    if (!newGoalName || !newGoalTarget) return;
    await createGoal(newGoalName, parseFloat(newGoalTarget));
    setCreateModalVisible(false);
    setNewGoalName('');
    setNewGoalTarget('');
    loadGoals();
  };

  const handleAddFunds = async () => {
    if (!selectedGoalId) return;
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    try {
      await addFundsToGoal(selectedGoalId, amount);
      setFundsModalVisible(false);
      setFundAmount('');
      setSelectedGoalId(null);
      await loadGoals();
    } catch (e) {
      console.error("Failed to add funds:", e);
      Alert.alert("Error", "Could not add funds");
    }
  };

  const openFundsModal = (id: string) => {
    setSelectedGoalId(id);
    setFundsModalVisible(true);
  };

  const handleDeleteGoal = async (id: string) => {
    await deleteGoal(id);
    loadGoals();
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        <Text className="text-text font-fraunces-bold text-3xl mb-2 mt-4 ml-2">Savings Jars</Text>
        <Text className="text-textMuted font-manrope mb-8 ml-2">Allocate money to visually fill up your goals.</Text>
        
        {goals.map(goal => (
          <SavingsJar key={goal.id} goal={goal} onAddFunds={() => openFundsModal(goal.id)} onDelete={handleDeleteGoal} />
        ))}
        
        <View className="h-24" />
      </ScrollView>

      {/* Floating Add Button */}
      <Pressable
        className="absolute bottom-6 right-6 w-16 h-16 bg-primary rounded-full items-center justify-center z-50 shadow-xl shadow-primary/30"
        onPress={() => setCreateModalVisible(true)}
      >
        <Text className="text-primaryForeground font-fraunces-bold text-4xl mb-1">+</Text>
      </Pressable>

      {/* Create Goal Modal */}
      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-surface p-8 rounded-t-[40px]">
            <Text className="text-text font-fraunces-bold text-2xl mb-8">Create New Jar</Text>
            
            <Text className="text-textMuted font-manrope mb-2 ml-1">Goal Name</Text>
            <TextInput 
              className="text-text p-3 text-lg font-manrope border-b border-border mb-8"
              placeholder="e.g. Vacation to Japan"
              placeholderTextColor={theme.colors.textMuted}
              value={newGoalName}
              onChangeText={setNewGoalName}
            />

            <Text className="text-textMuted font-manrope mb-2 ml-1">Target Amount ($)</Text>
            <TextInput 
              className="text-text p-3 text-2xl font-fraunces-bold border-b border-border mb-10"
              placeholder="e.g. 2000"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="numeric"
              value={newGoalTarget}
              onChangeText={setNewGoalTarget}
              style={{ fontVariant: ['tabular-nums'] }}
            />

            <Pressable className="bg-primary p-4 rounded-full items-center mb-4 shadow-lg shadow-primary/30" onPress={handleCreateGoal}>
              <Text className="text-primaryForeground font-manrope-bold text-lg">Create Goal</Text>
            </Pressable>
            
            <Pressable className="p-4 items-center mb-4" onPress={() => setCreateModalVisible(false)}>
              <Text className="text-danger font-manrope-bold text-lg">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Add Funds Modal */}
      <Modal visible={fundsModalVisible} animationType="fade" transparent>
        <View className="flex-1 justify-center bg-black/70 p-4">
          <View className="bg-surface p-8 rounded-[40px]">
            <Text className="text-text font-fraunces-bold text-2xl mb-2">Add Funds</Text>
            <Text className="text-textMuted font-manrope mb-8">How much are you saving towards this goal?</Text>
            
            <TextInput 
              className="text-text p-3 text-3xl font-fraunces-bold border-b border-border mb-10 text-center"
              placeholder="0.00"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="numeric"
              value={fundAmount}
              onChangeText={setFundAmount}
              style={{ fontVariant: ['tabular-nums'] }}
              autoFocus
            />

            <Pressable className="bg-primary p-4 rounded-full items-center mb-4 shadow-lg shadow-primary/30" onPress={handleAddFunds}>
              <Text className="text-primaryForeground font-manrope-bold text-lg">Add Amount</Text>
            </Pressable>
            
            <Pressable className="p-4 items-center" onPress={() => setFundsModalVisible(false)}>
              <Text className="text-danger font-manrope-bold text-lg">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
