export const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Shopping',
  'Transportation',
  'Housing',
  'Utilities',
  'Health & Fitness',
  'Entertainment',
  'Personal Care',
  'Education',
  'Salary',
  'Investments',
  'Gifts & Donations',
  'Other'
];

export const getCategoryIcon = (category: string): string => {
  const map: Record<string, string> = {
    'Food & Dining': 'fast-food-outline',
    'Groceries': 'cart-outline',
    'Shopping': 'bag-handle-outline',
    'Transportation': 'car-outline',
    'Housing': 'home-outline',
    'Utilities': 'flash-outline',
    'Health & Fitness': 'fitness-outline',
    'Entertainment': 'film-outline',
    'Personal Care': 'cut-outline',
    'Education': 'school-outline',
    'Salary': 'cash-outline',
    'Investments': 'trending-up-outline',
    'Gifts & Donations': 'gift-outline',
    'Other': 'ellipsis-horizontal-circle-outline'
  };
  return map[category] || 'cash-outline';
};
