/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, mockDatabase } from '@nocobase/database';
import { uid } from '@nocobase/utils';
import axios from 'axios';
import execa from 'execa';
import { resolve } from 'path';
import { getPortPromise } from 'portfinder';

const delay = (timeout) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, timeout);
  });
};

const checkServer = async (port?: number, duration = 1000, max = 60 * 10) => {
  return new Promise((resolve, reject) => {
    let count = 0;
    const baseURL = `http://127.0.0.1:${port}`;
    const url = `${baseURL}/api/__health_check`;
    console.log('url', url);
    const timer = setInterval(async () => {
      if (count++ > max) {
        clearInterval(timer);
        return reject(new Error('Server start timeout.'));
      }

      axios
        .get(url)
        .then((response) => {
          if (response.status === 200) {
            clearInterval(timer);
            resolve(true);
          }
        })
        .catch((error) => {
          const data = error?.response?.data?.error;
          console.error('Request error:', error?.response?.data?.error);
          if (data?.code === 'APP_NOT_INSTALLED_ERROR') {
            resolve(data?.code);
          }
        });
    }, duration);
  });
};

const run = (command, args, options) => {
  return execa(command, args, {
    ...process.env,
    ...options,
  });
};

const createDatabase = async () => {
  if (process.env.DB_DIALECT === 'sqlite') {
    return 'nocobase';
  }
  const db = await createMockDatabase();
  const name = `d_${uid()}`;
  await db.sequelize.query(`CREATE DATABASE ${name}`);
  await db.close();
  return name;
};

describe.skip('cli', () => {
  test('install', async () => {
    const database = await createDatabase();
    const port = await getPortPromise({
      port: 13000,
    });
    console.log(process.env.DB_DIALECT, port);
    const dbFile = `storage/tests/db/nocobase-${uid()}.sqlite`;
    const env = {
      ...process.env,
      APP_PORT: `${port}`,
      DB_STORAGE: dbFile,
      DB_DATABASE: database,
      SOCKET_PATH: `storage/tests/gateway-e2e-${uid()}.sock`,
      PM2_HOME: resolve(process.cwd(), `storage/tests/.pm2-${uid()}`),
    };
    const subprocess1 = await execa('yarn', ['nocobase', 'install'], {
      env,
    });
    expect(subprocess1.stdout.includes('app installed successfully')).toBeTruthy();
    const subprocess2 = await execa('yarn', ['nocobase', 'install'], {
      env,
    });
    expect(subprocess2.stdout.includes('app is installed')).toBeTruthy();
    const subprocess3 = await execa('yarn', ['nocobase', 'install', '-f'], {
      env,
    });
    expect(subprocess3.stdout.includes('app reinstalled successfully')).toBeTruthy();
  });

  test('start + install', async () => {
    console.log(process.env.DB_DIALECT);
    const database = await createDatabase();
    const port = await getPortPromise({
      port: 13000,
    });
    const dbFile = `storage/tests/db/nocobase-${uid()}.sqlite`;
    const env = {
      ...process.env,
      APP_PORT: `${port}`,
      DB_STORAGE: dbFile,
      DB_DATABASE: database,
      SOCKET_PATH: `storage/tests/gateway-e2e-${uid()}.sock`,
      PM2_HOME: resolve(process.cwd(), `storage/tests/.pm2-${uid()}`),
    };
    const subprocess1 = execa('yarn', ['nocobase', 'dev', '--server'], {
      env,
    });
    const code = await checkServer(port);
    console.log(code);
    expect(code).toBe('APP_NOT_INSTALLED_ERROR');
    execa('yarn', ['nocobase', 'install'], {
      env,
    });
    await delay(5000);
    const data2 = await checkServer(port);
    expect(data2).toBe(true);
    subprocess1.cancel();
  });

  test('install + start', async () => {
    console.log(process.env.DB_DIALECT);
    const database = await createDatabase();
    const port = await getPortPromise({
      port: 13000,
    });
    const dbFile = `storage/tests/db/nocobase-${uid()}.sqlite`;
    const env = {
      ...process.env,
      APP_PORT: `${port}`,
      DB_STORAGE: dbFile,
      DB_DATABASE: database,
      SOCKET_PATH: `storage/tests/gateway-e2e-${uid()}.sock`,
      PM2_HOME: resolve(process.cwd(), `storage/tests/.pm2-${uid()}`),
    };
    await execa('yarn', ['nocobase', 'install'], {
      env,
    });
    const subprocess1 = execa('yarn', ['nocobase', 'dev', '--server'], {
      env,
    });
    const code = await checkServer(port);
    expect(code).toBe(true);
    subprocess1.cancel();
  });

  test('quickstart', async () => {
    console.log(process.env.DB_DIALECT);
    const database = await createDatabase();
    const port = await getPortPromise({
      port: 13000,
    });
    const dbFile = `storage/tests/db/nocobase-${uid()}.sqlite`;
    const env = {
      ...process.env,
      APP_PORT: `${port}`,
      DB_STORAGE: dbFile,
      DB_DATABASE: database,
      SOCKET_PATH: `storage/tests/gateway-e2e-${uid()}.sock`,
      PM2_HOME: resolve(process.cwd(), `storage/tests/.pm2-${uid()}`),
    };
    console.log('DB_STORAGE:', dbFile);
    const subprocess1 = execa('yarn', ['nocobase', 'dev', '--server', '--quickstart'], {
      env,
    });
    const code = await checkServer(port);
    expect(code).toBe(true);
    subprocess1.cancel();
    const subprocess2 = execa('yarn', ['nocobase', 'dev', '--server', '--quickstart'], {
      env,
    });
    const code2 = await checkServer(port);
    expect(code2).toBe(true);
    subprocess2.cancel();
  });

  test('install + upgrade', async () => {
    console.log(process.env.DB_DIALECT);
    const database = await createDatabase();
    const port = await getPortPromise({
      port: 13000,
    });
    const dbFile = `storage/tests/db/nocobase-${uid()}.sqlite`;
    const env = {
      ...process.env,
      APP_PORT: `${port}`,
      DB_STORAGE: dbFile,
      DB_DATABASE: database,
      SOCKET_PATH: `storage/tests/gateway-e2e-${uid()}.sock`,
      PM2_HOME: resolve(process.cwd(), `storage/tests/.pm2-${uid()}`),
    };
    console.log('DB_STORAGE:', dbFile);
    await execa('yarn', ['nocobase', 'install'], {
      env,
    });
    const subprocess2 = await execa('yarn', ['nocobase', 'upgrade'], {
      env,
    });
    expect(subprocess2.stdout.includes('NocoBase has been upgraded')).toBe(true);
  });

  test('quickstart + upgrade', async () => {
    console.log(process.env.DB_DIALECT);
    const database = await createDatabase();
    const port = await getPortPromise({
      port: 13000,
    });
    const dbFile = `storage/tests/db/nocobase-${uid()}.sqlite`;
    const env = {
      ...process.env,
      APP_PORT: `${port}`,
      DB_STORAGE: dbFile,
      DB_DATABASE: database,
      SOCKET_PATH: `storage/tests/gateway-e2e-${uid()}.sock`,
      PM2_HOME: resolve(process.cwd(), `storage/tests/.pm2-${uid()}`),
    };
    console.log('DB_STORAGE:', dbFile);
    const subprocess1 = execa('yarn', ['nocobase', 'dev', '--server', '--quickstart'], {
      env,
    });
    const code = await checkServer(port);
    expect(code).toBe(true);
    await execa('yarn', ['nocobase', 'upgrade'], {
      env,
    });
    await delay(5000);
    const code2 = await checkServer(port);
    expect(code2).toBe(true);
    subprocess1.cancel();
  });
});
