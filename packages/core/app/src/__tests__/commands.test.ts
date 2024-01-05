import { uid } from '@nocobase/utils';
import axios from 'axios';
import execa from 'execa';

const delay = (timeout) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, timeout);
  });
};

const checkServer = async (duration = 1000, max = 60 * 10) => {
  return new Promise((resolve, reject) => {
    let count = 0;
    const url = `${process.env.APP_BASE_URL}/api/__health_check`;
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

describe('cli', () => {
  test('install', async () => {
    console.log(process.env.DB_DIALECT);
    const dbFile = `storage/db/nocobase-${uid()}.sqlite`;
    const subprocess1 = await execa('yarn', ['nocobase', 'install'], {
      env: {
        DB_STORAGE: dbFile,
      },
    });
    expect(subprocess1.stdout.includes('app installed successfully')).toBeTruthy();
    const subprocess2 = await execa('yarn', ['nocobase', 'install'], {
      env: {
        DB_STORAGE: dbFile,
      },
    });
    expect(subprocess2.stdout.includes('app is installed')).toBeTruthy();
    const subprocess3 = await execa('yarn', ['nocobase', 'install', '-f'], {
      env: {
        DB_STORAGE: dbFile,
      },
    });
    expect(subprocess3.stdout.includes('app reinstalled successfully')).toBeTruthy();
  });

  test('start + install', async () => {
    console.log(process.env.DB_DIALECT);
    const dbFile = `storage/db/nocobase-${uid()}.sqlite`;
    const subprocess1 = execa('yarn', ['nocobase', 'dev', '--server'], {
      env: {
        ...process.env,
        DB_DIALECT: 'sqlite',
        DB_STORAGE: dbFile,
      },
    });
    process.env.APP_BASE_URL = `http://127.0.0.1:${process.env.APP_PORT}`;
    const code = await checkServer();
    console.log(code);
    expect(code).toBe('APP_NOT_INSTALLED_ERROR');
    execa('yarn', ['nocobase', 'install'], {
      env: {
        ...process.env,
        DB_DIALECT: 'sqlite',
        DB_STORAGE: dbFile,
      },
    });
    await delay(5000);
    const data2 = await checkServer();
    expect(data2).toBe(true);
    subprocess1.cancel();
  });

  test('install + start', async () => {
    console.log(process.env.DB_DIALECT);
    const dbFile = `storage/db/nocobase-${uid()}.sqlite`;
    await execa('yarn', ['nocobase', 'install'], {
      env: {
        ...process.env,
        DB_DIALECT: 'sqlite',
        DB_STORAGE: dbFile,
      },
    });
    const subprocess1 = execa('yarn', ['nocobase', 'dev', '--server'], {
      env: {
        ...process.env,
        DB_DIALECT: 'sqlite',
        DB_STORAGE: dbFile,
      },
    });
    process.env.APP_BASE_URL = `http://127.0.0.1:${process.env.APP_PORT}`;
    const code = await checkServer();
    expect(code).toBe(true);
    subprocess1.cancel();
  });

  test('quickstart', async () => {
    console.log(process.env.DB_DIALECT);
    process.env.APP_BASE_URL = `http://127.0.0.1:${process.env.APP_PORT}`;
    const dbFile = `storage/db/nocobase-${uid()}.sqlite`;
    console.log('DB_STORAGE:', dbFile);
    const subprocess1 = execa('yarn', ['nocobase', 'dev', '--server', '--quickstart'], {
      env: {
        ...process.env,
        DB_DIALECT: 'sqlite',
        DB_STORAGE: dbFile,
      },
    });
    const code = await checkServer();
    expect(code).toBe(true);
    subprocess1.cancel();
    const subprocess2 = execa('yarn', ['nocobase', 'dev', '--server', '--quickstart'], {
      env: {
        ...process.env,
        DB_DIALECT: 'sqlite',
        DB_STORAGE: dbFile,
      },
    });
    const code2 = await checkServer();
    expect(code2).toBe(true);
    subprocess2.cancel();
  });

  test('install + upgrade', async () => {
    console.log(process.env.DB_DIALECT);
    process.env.APP_BASE_URL = `http://127.0.0.1:${process.env.APP_PORT}`;
    const dbFile = `storage/db/nocobase-${uid()}.sqlite`;
    console.log('DB_STORAGE:', dbFile);
    await execa('yarn', ['nocobase', 'install'], {
      env: {
        ...process.env,
        DB_DIALECT: 'sqlite',
        DB_STORAGE: dbFile,
      },
    });
    const subprocess2 = await execa('yarn', ['nocobase', 'upgrade'], {
      env: {
        ...process.env,
        DB_DIALECT: 'sqlite',
        DB_STORAGE: dbFile,
      },
    });
    expect(subprocess2.stdout.includes('NocoBase has been upgraded')).toBe(true);
  });

  test('quickstart + upgrade', async () => {
    console.log(process.env.DB_DIALECT);
    process.env.APP_BASE_URL = `http://127.0.0.1:${process.env.APP_PORT}`;
    const dbFile = `storage/db/nocobase-${uid()}.sqlite`;
    console.log('DB_STORAGE:', dbFile);
    const subprocess1 = execa('yarn', ['nocobase', 'dev', '--server', '--quickstart'], {
      env: {
        ...process.env,
        DB_DIALECT: 'sqlite',
        DB_STORAGE: dbFile,
      },
    });
    const code = await checkServer();
    expect(code).toBe(true);
    await execa('yarn', ['nocobase', 'upgrade'], {
      env: {
        ...process.env,
        DB_DIALECT: 'sqlite',
        DB_STORAGE: dbFile,
      },
    });
    await delay(5000);
    const code2 = await checkServer();
    expect(code2).toBe(true);
    subprocess1.cancel();
  });
});
