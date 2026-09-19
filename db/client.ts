import * as SQLite from 'expo-sqlite';
import { schema } from './schema';

// Singleton database connection
const db = SQLite.openDatabaseSync('app.db');

let isInitialized = false;

export const getDb = () => {
  if (!isInitialized) {
    db.execSync(schema);
    isInitialized = true;
  }
  return db;
};
