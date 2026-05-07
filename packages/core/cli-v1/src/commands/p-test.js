/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const execa = require('execa');
const { resolve } = require('path');
const pAll = require('p-all');
const dotenv = require('dotenv');
const fs = require('fs');
const glob = require('glob');
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

async function runApp(dir, index = 0) {
  // 一个进程需要占用两个端口? (一个是应用端口，一个是 socket 端口)
  index = index * 2;
  const { Client } = require('pg');
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
  return execa('yarn', ['nocobase', 'e2e', 'test', dir], {
    shell: true,
    stdio: 'inherit',
    env: {
      ...config,
      CI: process.env.CI,
      __E2E__: true,
      APP_BASE_URL: undefined,
      LOGGER_LEVEL: 'error',
      APP_ENV: 'production',
      APP_PORT: 20000 + index,
      DB_DATABASE: `nocobase${index}`,
      SOCKET_PATH: `storage/e2e/gateway-e2e-${index}.sock`,
      PM2_HOME: resolve(process.cwd(), `storage/e2e/.pm2-${index}`),
      PLAYWRIGHT_AUTH_FILE: resolve(process.cwd(), `storage/playwright/.auth/admin-${index}.json`),
      E2E_JOB_ID: index,
    },
  });
}

exports.pTest = async (options) => {
  const dir = resolve(process.cwd(), 'storage/e2e');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const files = glob.sync(options.match, {
    ignore: options.ignore,
    root: process.cwd(),
  });

  const commands = splitArrayIntoParts(_.shuffle(files), options.concurrency || 4).map((v, i) => {
    return () => runApp(v.join(' '), i);
  });

  await pAll(commands, { concurrency: 4, stopOnError: false, ...options });
};

function splitArrayIntoParts(array, parts) {
  let chunkSize = Math.ceil(array.length / parts);
  return _.chunk(array, chunkSize);
}
