const execa = require('execa');
const { resolve, dirname } = require('path');
const pAll = require('p-all');
const dotenv = require('dotenv');
const fs = require('fs');
const { Client } = require('pg');
const glob = require('glob');

let ENV_FILE = resolve(process.cwd(), '.env.e2e');

if (!fs.existsSync(ENV_FILE)) {
  ENV_FILE = resolve(process.cwd(), '.env.e2e.example');
}

const data = fs.readFileSync(ENV_FILE, 'utf-8');
const config = {
  ...dotenv.parse(data),
  ...process.env,
};

async function runApp(index = 1, dir) {
  const database = `nocobase${index}`;
  const client = new Client({
    host: config['DB_HOST'],
    port: Number(config['DB_PORT']),
    user: config['DB_USER'],
    password: config['DB_PASSWORD'],
    database: 'postgres',
  });
  await client.connect();
  await client.query(`DROP DATABASE IF EXISTS "${database}"`);
  await client.query(`CREATE DATABASE "${database}";`);
  await client.end();
  return execa('yarn', ['nocobase', 'e2e', 'test', dir, '-x', '--skip-reporter'], {
    shell: true,
    stdio: 'inherit',
    env: {
      ...config,
      CI: true,
      __E2E__: true,
      APP_BASE_URL: undefined,
      LOGGER_LEVEL: 'error',
      APP_ENV: 'production',
      APP_PORT: 20000 + index,
      DB_DATABASE: `nocobase${index}`,
      SOCKET_PATH: `storage/gateway-e2e-${index}.sock`,
      PM2_HOME: resolve(process.cwd(), `storage/.pm2-${index}`),
      PLAYWRIGHT_AUTH_FILE: resolve(process.cwd(), `storage/playwright/.auth/admin-${index}.json`),
    },
  });
}

exports.pTest = async (options) => {
  const files = glob.sync('packages/**/__e2e__/**/*.test.ts', {
    root: process.cwd(),
  });
  const fileSet = new Set();

  for (const file of files) {
    fileSet.add(dirname(file));
  }

  const commands = [...fileSet.values()].map((v, i) => {
    return () => runApp(i + 1, v);
  });

  await pAll(commands, { concurrency: 3, stopOnError: false, ...options });
};
