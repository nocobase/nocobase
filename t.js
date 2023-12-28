const execa = require('execa');
const { resolve } = require('path');
const pLimit = require('p-limit');
const dotenv = require('dotenv');
const fs = require('fs');
const { Client } = require('pg');
const _ = require('lodash');

let ENV_FILE = resolve(process.cwd(), '.env.e2e');

if (!fs.existsSync(ENV_FILE)) {
  ENV_FILE = resolve(process.cwd(), '.env.e2e.example');
}

const data = fs.readFileSync(ENV_FILE, 'utf-8');
const config = {
  ...dotenv.parse(data),
  ...process.env,
};
const limit = pLimit(5);
const input = _.range(50).map((i) => limit(() => runApp(i + 1)));

async function runApp(index = 1) {
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
  return execa(
    'yarn',
    [
      'nocobase',
      'e2e',
      'test',
      'packages/plugins/@nocobase/plugin-workflow/src/client/__e2e__/nodes/Calculation.test.ts',
      '-x',
      '--skip-reporter',
    ],
    {
      shell: true,
      stdio: 'inherit',
      env: {
        ...config,
        APP_ENV: 'production',
        // APP_ENV_PATH: `.env${index}.e2e`,
        APP_PORT: 20000 + index,
        DB_DATABASE: `nocobase${index}`,
        SOCKET_PATH: `storage/gateway-e2e-${index}.sock`,
        PM2_HOME: resolve(process.cwd(), `storage/.pm2-${index}`),
        PLAYWRIGHT_AUTH_FILE: resolve(process.cwd(), `storage/playwright/.auth/admin-${index}.json`),
      },
    },
  );
}

(async () => {
  await Promise.all(input);
})();
