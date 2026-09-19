export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  note: string;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
}

export const schema = `
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT CHECK(type IN ('income', 'expense')),
  amount INTEGER,
  category TEXT,
  date TEXT,
  note TEXT
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  name TEXT,
  target_amount INTEGER,
  current_amount INTEGER DEFAULT 0
);
`;
