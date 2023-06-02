export { mockDatabase } from '@nocobase/database';
export * from './mockServer';
export { pgOnly };

const pgOnly: () => jest.Describe = () => (process.env.DB_DIALECT == 'postgres' ? describe : describe.skip);

export function randomStr() {
  // create random string
  return Math.random().toString(36).substring(2);
}
