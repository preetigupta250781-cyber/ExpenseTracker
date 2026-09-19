import { getDb } from './client';
import { Transaction } from './schema';
import * as crypto from 'expo-crypto';

export async function insertTransaction(tx: Omit<Transaction, 'id'>): Promise<void> {
  const db = getDb();
  const id = crypto.randomUUID();
  await db.runAsync(
    'INSERT INTO transactions (id, type, amount, category, date, note) VALUES (?, ?, ?, ?, ?, ?)',
    id, tx.type, tx.amount, tx.category, tx.date, tx.note
  );
}

export async function updateTransaction(tx: Transaction): Promise<void> {
  const db = getDb();
  await db.runAsync(
    'UPDATE transactions SET type = ?, amount = ?, category = ?, date = ?, note = ? WHERE id = ?',
    tx.type, tx.amount, tx.category, tx.date, tx.note, tx.id
  );
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = getDb();
  return await db.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY date DESC');
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const db = getDb();
  return await db.getFirstAsync<Transaction>('SELECT * FROM transactions WHERE id = ?', id);
}

export async function getFilteredTransactions(filters: { category?: string; startDate?: string; endDate?: string }): Promise<Transaction[]> {
  const db = getDb();
  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];

  if (filters.category) {
    query += ' AND category = ?';
    params.push(filters.category);
  }
  if (filters.startDate) {
    query += ' AND date >= ?';
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    query += ' AND date <= ?';
    params.push(filters.endDate);
  }

  query += ' ORDER BY date DESC';
  
  if (params.length === 0) {
    return await db.getAllAsync<Transaction>(query);
  }
  return await db.getAllAsync<Transaction>(query, ...params);
}

export async function getSummary(): Promise<{ totalIncome: number; totalExpense: number; balance: number }> {
  const db = getDb();
  const results = await db.getAllAsync<{ type: string; total: number }>(
    'SELECT type, SUM(amount) as total FROM transactions GROUP BY type'
  );

  let totalIncome = 0;
  let totalExpense = 0;

  for (const row of results) {
    if (row.type === 'income') {
      totalIncome = row.total || 0;
    } else if (row.type === 'expense') {
      totalExpense = row.total || 0;
    }
  }

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}

export async function getMonthlySummary(): Promise<{ month: string; income: number; expense: number }[]> {
  const db = getDb();
  const results = await db.getAllAsync<{ month: string; type: string; total: number }>(
    "SELECT strftime('%Y-%m', date) as month, type, SUM(amount) as total FROM transactions GROUP BY month, type ORDER BY month DESC"
  );

  const monthMap: Record<string, { month: string; income: number; expense: number }> = {};

  for (const row of results) {
    if (!row.month) continue; // In case of invalid dates
    
    if (!monthMap[row.month]) {
      monthMap[row.month] = { month: row.month, income: 0, expense: 0 };
    }
    if (row.type === 'income') {
      monthMap[row.month].income = row.total || 0;
    } else if (row.type === 'expense') {
      monthMap[row.month].expense = row.total || 0;
    }
  }

  return Object.values(monthMap);
}

export async function getExpensesByCategory(monthStr: string): Promise<{ category: string; total: number }[]> {
  const db = getDb();
  return await db.getAllAsync<{ category: string; total: number }>(
    "SELECT category, SUM(amount) as total FROM transactions WHERE type = 'expense' AND strftime('%Y-%m', date) = ? GROUP BY category",
    monthStr
  );
}

// Goals Queries
import { Goal } from './schema';

export async function createGoal(name: string, targetAmount: number): Promise<void> {
  const db = getDb();
  const id = crypto.randomUUID();
  await db.runAsync(
    'INSERT INTO goals (id, name, target_amount, current_amount) VALUES (?, ?, ?, 0)',
    [id, name, targetAmount]
  );
}

export async function getGoals(): Promise<Goal[]> {
  const db = getDb();
  return await db.getAllAsync<Goal>('SELECT * FROM goals');
}

export async function addFundsToGoal(id: string, amount: number): Promise<void> {
  const db = getDb();
  await db.runAsync(
    'UPDATE goals SET current_amount = COALESCE(current_amount, 0) + ? WHERE id = ?',
    [amount, id]
  );
}

export async function deleteGoal(id: string): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM goals WHERE id = ?', id);
}
