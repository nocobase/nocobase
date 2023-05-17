import type { SuiteAPI } from 'vitest';
import { describe } from 'vitest';

export { mockDatabase } from '@nocobase/database';
export * from './mockServer';
export { pgOnly };

const pgOnly: () => SuiteAPI | typeof describe.skip = () =>
  process.env.DB_DIALECT == 'postgres' ? describe : describe.skip;

export function randomStr() {
  // create random string
  return Math.random().toString(36).substring(2);
}
