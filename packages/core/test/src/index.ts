export { mockDatabase } from '@nocobase/database';
export * from './mockServer';

const pgOnly: () => jest.Describe = () => (process.env.DB_DIALECT == 'postgres' ? describe : describe.skip);
export { pgOnly };

export function randomStr() {
  // create random string
  return Math.random().toString(36).substring(2);
}
