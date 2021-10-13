import { DatabaseOptions } from '@nocobase/database';

export default {
  dialect: 'sqlite',
  dialectModule: require('sqlite3'),
  storage: 'db.sqlite',
} as DatabaseOptions;
