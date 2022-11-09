export { mockDatabase } from '@nocobase/database';
export * from './mockServer';

const pgOnly = () => (process.env.DB_DIALECT == 'postgres' ? describe : describe.skip);
export { pgOnly };
