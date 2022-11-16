import { IDatabaseOptions } from '@nocobase/database';

export default {
  logging: process.env.DB_LOGGING == 'on' ? customLogger : false,
  dialect: process.env.DB_DIALECT as any,
  storage: process.env.DB_STORAGE,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT as any,
  timezone: process.env.DB_TIMEZONE,
  tablePrefix: process.env.DB_TABLE_PREFIX,
} as IDatabaseOptions;

function customLogger(queryString, queryObject) {
  console.log(queryString); // outputs a string
  console.log(queryObject.bind); // outputs an array
}
