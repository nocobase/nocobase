export { mockDatabase } from '@nocobase/database';
export * from './mockServer';

const pgOnly: () => jest.Describe = () => (process.env.DB_DIALECT == 'postgres' ? describe : describe.skip);
export { pgOnly };
