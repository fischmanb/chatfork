import { neon } from '@neondatabase/serverless';

export function getDB(databaseUrl: string) {
  return neon(databaseUrl);
}

// Type-safe query wrapper
export async function query<T = any>(
  db: ReturnType<typeof neon>, 
  sql: string, 
  params?: any[]
): Promise<T[]> {
  return db(sql, params) as Promise<T[]>;
}

// Single row query wrapper
export async function queryOne<T = any>(
  db: ReturnType<typeof neon>, 
  sql: string, 
  params?: any[]
): Promise<T | null> {
  const results = await db(sql, params) as T[];
  return results.length > 0 ? results[0] : null;
}
