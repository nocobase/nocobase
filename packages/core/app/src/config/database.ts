import { IDatabaseOptions } from '@nocobase/database';

function getEnvValue(key, defaultValue?) {
  return process.env[key] || defaultValue;
}

function extractSSLOptionsFromEnv() {
  const sslOptions = {};

  const ca = getEnvValue('DB_DIALECT_OPTIONS_SSL_CA');
  const key = getEnvValue('DB_DIALECT_OPTIONS_SSL_KEY');
  const cert = getEnvValue('DB_DIALECT_OPTIONS_SSL_CERT');
  const rejectUnauthorized = getEnvValue('DB_DIALECT_OPTIONS_SSL_REJECT_UNAUTHORIZED');

  if (ca) sslOptions['ca'] = ca;
  if (key) sslOptions['key'] = key;
  if (cert) sslOptions['cert'] = cert;
  if (rejectUnauthorized) sslOptions['rejectUnauthorized'] = rejectUnauthorized === 'true';

  return sslOptions;
}

const databaseOptions = {
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
  schema: process.env.DB_SCHEMA,
  underscored: process.env.DB_UNDERSCORED === 'true',
} as IDatabaseOptions;

const sslOptions = extractSSLOptionsFromEnv();

if (Object.keys(sslOptions).length) {
  databaseOptions.dialectOptions = databaseOptions.dialectOptions || {};
  databaseOptions.dialectOptions['ssl'] = sslOptions;
}

export default databaseOptions;

function customLogger(queryString, queryObject) {
  console.log(queryString); // outputs a string
  if (queryObject?.bind) {
    console.log(queryObject.bind); // outputs an array
  }
}
