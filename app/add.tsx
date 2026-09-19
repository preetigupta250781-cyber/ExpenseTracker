import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { insertTransaction, updateTransaction, getTransactionById } from '../db/queries';
import { CATEGORIES } from '../utils/categories';
import { theme } from '../components/theme';

export default function AddScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditing = !!id;
  
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');
  const [errors, setErrors] = useState<{ amount?: string }>({});

  useEffect(() => {
    if (id) {
      loadTransaction(id);
    }
  }, [id]);

  const loadTransaction = async (txId: string) => {
    const tx = await getTransactionById(txId);
    if (tx) {
      setType(tx.type);
      setAmount(tx.amount.toString());
      setCategory(tx.category);
      setDate(new Date(tx.date));
      setNote(tx.note || '');
    }
  };

  const handleSave = async () => {
    setErrors({});
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrors({ amount: 'Enter a valid amount greater than 0' });
      return;
    }

    const txData = {
      type,
      amount: numAmount,
      category,
      date: date.toISOString().split('T')[0],
      note: note.trim(),
    };

    if (id) {
      await updateTransaction({ id, ...txData });
    } else {
      await insertTransaction(txData);
    }

    router.back();
  };

  return (
    <View className="flex-1 bg-background p-6">
      
      {/* Type Toggle */}
      <View className="flex-row bg-surface rounded-full mb-8 p-1 shadow-sm">
        <Pressable 
          className={`flex-1 py-3 rounded-full items-center ${type === 'expense' ? 'bg-danger' : 'bg-transparent'}`}
          onPress={() => setType('expense')}
        >
          <Text className={`font-manrope-bold ${type === 'expense' ? 'text-text' : 'text-textMuted'}`}>Expense</Text>
        </Pressable>
        <Pressable 
          className={`flex-1 py-3 rounded-full items-center ${type === 'income' ? 'bg-success' : 'bg-transparent'}`}
          onPress={() => setType('income')}
        >
          <Text className={`font-manrope-bold ${type === 'income' ? 'text-primaryForeground' : 'text-textMuted'}`}>Income</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Amount */}
        <View className="mb-8">
          <Text className="text-textMuted font-manrope mb-2">Amount</Text>
          <TextInput 
            className="text-text font-fraunces-bold text-4xl border-b border-border pb-2"
            placeholder="0.00"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={(val) => {
              setAmount(val);
              setErrors(prev => ({ ...prev, amount: undefined }));
            }}
            style={{ fontVariant: ['tabular-nums'] }}
            autoFocus
          />
          {errors.amount && <Text className="text-danger font-manrope mt-2">{errors.amount}</Text>}
        </View>

        {/* Category */}
        <View className="mb-8 border-b border-border pb-2">
          <Text className="text-textMuted font-manrope mb-2">Category</Text>
          <Picker
            selectedValue={category}
            onValueChange={(itemValue) => setCategory(itemValue)}
            dropdownIconColor={theme.colors.text}
            style={{ color: theme.colors.text, marginLeft: -16 }}
          >
            {CATEGORIES.map(cat => (
              <Picker.Item key={cat} label={cat} value={cat} color={theme.colors.background} />
            ))}
          </Picker>
        </View>

        {/* Date */}
        <View className="mb-8 border-b border-border pb-4">
          <Text className="text-textMuted font-manrope mb-2">Date</Text>
          
          {Platform.OS === 'android' && (
            <Pressable onPress={() => setShowDatePicker(true)} className="py-2">
              <Text className="text-text font-manrope text-lg">
                {date.toLocaleDateString()}
              </Text>
            </Pressable>
          )}

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onValueChange={(event, selectedDate) => {
                if (Platform.OS === 'android') {
                  setShowDatePicker(false);
                }
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
              onDismiss={() => {
                if (Platform.OS === 'android') setShowDatePicker(false);
              }}
              themeVariant="dark"
            />
          )}
        </View>

        {/* Note */}
        <View className="mb-10">
          <Text className="text-textMuted font-manrope mb-2">Note (Optional)</Text>
          <TextInput 
            className="text-text font-manrope text-lg border-b border-border pb-2"
            placeholder="What was this for?"
            placeholderTextColor={theme.colors.textMuted}
            value={note}
            onChangeText={setNote}
          />
        </View>

        <Pressable 
          className="bg-primary p-4 rounded-full items-center shadow-lg shadow-primary/30 mb-8"
          onPress={handleSave}
        >
          <Text className="text-primaryForeground font-manrope-bold text-xl">{isEditing ? 'Update Transaction' : 'Save Transaction'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
