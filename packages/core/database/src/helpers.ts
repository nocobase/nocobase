import { IDatabaseOptions } from './database';
import fs from 'fs';

function getEnvValue(key, defaultValue?) {
  return process.env[key] || defaultValue;
}

function isFilePath(value) {
  return fs.promises
    .stat(value)
    .then((stats) => stats.isFile())
    .catch((err) => {
      if (err.code === 'ENOENT') {
        return false;
      }

      throw err;
    });
}

function getValueOrFileContent(envVarName) {
  const value = getEnvValue(envVarName);

  if (!value) {
    return Promise.resolve(null);
  }

  return isFilePath(value)
    .then((isFile) => {
      if (isFile) {
        return fs.promises.readFile(value, 'utf8');
      }
      return value;
    })
    .catch((error) => {
      console.error(`Failed to read file content for environment variable ${envVarName}.`);
      throw error;
    });
}

function extractSSLOptionsFromEnv() {
  return Promise.all([
    getValueOrFileContent('DB_DIALECT_OPTIONS_SSL_MODE'),
    getValueOrFileContent('DB_DIALECT_OPTIONS_SSL_CA'),
    getValueOrFileContent('DB_DIALECT_OPTIONS_SSL_KEY'),
    getValueOrFileContent('DB_DIALECT_OPTIONS_SSL_CERT'),
    getValueOrFileContent('DB_DIALECT_OPTIONS_SSL_REJECT_UNAUTHORIZED'),
  ]).then(([mode, ca, key, cert, rejectUnauthorized]) => {
    const sslOptions = {};

    if (mode) sslOptions['mode'] = mode;
    if (ca) sslOptions['ca'] = ca;
    if (key) sslOptions['key'] = key;
    if (cert) sslOptions['cert'] = cert;
    if (rejectUnauthorized) sslOptions['rejectUnauthorized'] = rejectUnauthorized === 'true';

    return sslOptions;
  });
}

export async function parseDatabaseOptionsFromEnv(): Promise<IDatabaseOptions> {
  const databaseOptions: IDatabaseOptions = {
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
  };

  const sslOptions = await extractSSLOptionsFromEnv();

  if (Object.keys(sslOptions).length) {
    databaseOptions.dialectOptions = databaseOptions.dialectOptions || {};
    databaseOptions.dialectOptions['ssl'] = sslOptions;
  }

  return databaseOptions;
}

function customLogger(queryString, queryObject) {
  console.log(queryString);
  if (queryObject?.bind) {
    console.log(queryObject.bind);
  }
}
