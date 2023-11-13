import axios from 'axios';
import dotenv from 'dotenv';
import type { CommonOptions } from 'execa';
import execa from 'execa';
import _ from 'lodash';
import net from 'net';
import fs from 'node:fs';
import path from 'path';

const PORT = process.env.APP_PORT || 20000;
export const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`;

export const commonConfig: any = {
  stdio: 'inherit',
};

export const runCommand = (command, argv, options: any = {}) => {
  return execa(command, argv, {
    shell: true,
    stdio: 'inherit',
    ..._.omit(options, 'force'),
    env: {
      ...process.env,
    },
  });
};

/**
 * 检查端口是否被占用
 * @param port
 * @returns
 */
function checkPort(port) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(port, '127.0.0.1');

    socket.on('connect', () => {
      socket.destroy();
      resolve(true); // 端口可用
    });

    socket.on('error', (error) => {
      resolve(false); // 端口被占用或不可访问
    });
  });
}

/**
 * 检查服务是否启动成功
 */
const checkServer = async (duration = 1000, max = 60 * 10) => {
  return new Promise((resolve, reject) => {
    let count = 0;
    const timer = setInterval(async () => {
      if (count++ > max) {
        clearInterval(timer);
        return reject(new Error('Server start timeout.'));
      }

      if (!(await checkPort(PORT))) {
        return;
      }

      axios
        .get(`${APP_BASE_URL}/api/__health_check`)
        .then((response) => {
          if (response.status === 200) {
            clearInterval(timer);
            resolve(true);
          }
        })
        .catch((error) => {
          console.error('Request error:', error.message);
        });
    }, duration);
  });
};

/**
 * 检查 UI 是否启动成功
 * @param duration
 */
const checkUI = async (duration = 1000, max = 60 * 10) => {
  return new Promise((resolve, reject) => {
    let count = 0;
    const timer = setInterval(async () => {
      if (count++ > max) {
        clearInterval(timer);
        return reject(new Error('UI start timeout.'));
      }

      axios
        .get(`${APP_BASE_URL}/__umi/api/bundle-status`)
        .then((response) => {
          if (response.data.bundleStatus.done) {
            clearInterval(timer);
            resolve(true);
          }
        })
        .catch((error) => {
          console.error('Request error:', error.message);
        });
    }, duration);
  });
};

export const runNocoBase = async (
  options?: CommonOptions<any> & {
    /**
     * 是否强制启动服务
     */
    force?: boolean;
    signal?: AbortSignal;
  },
) => {
  // 用于存放 playwright 自动生成的相关的文件
  if (!fs.existsSync('playwright')) {
    fs.mkdirSync('playwright');
  }

  if (!fs.existsSync('.env.e2e') && fs.existsSync('.env.e2e.example')) {
    const env = fs.readFileSync('.env.e2e.example');
    fs.writeFileSync('.env.e2e', env);
  }

  if (!fs.existsSync('.env.e2e')) {
    throw new Error('Please create .env.e2e file first!');
  }

  dotenv.config({ path: path.resolve(process.cwd(), '.env.e2e') });

  if (process.env.APP_BASE_URL && !options?.force) {
    console.log('APP_BASE_URL is setting, skip starting server.');
    return { awaitForNocoBase: () => {} };
  }

  const awaitForNocoBase = async () => {
    if (process.env.CI) {
      console.log('check server...');
      await checkServer();
    } else {
      console.log('check server...');
      await checkServer();
      console.log('server is ready, check UI...');
      await checkUI();
      console.log('UI is ready.');
    }
  };

  if (process.env.CI) {
    console.log('yarn nocobase install');
    await runCommand('yarn', ['nocobase', 'install'], options);
    console.log(`yarn start -d -p ${PORT}`);
    await runCommand('yarn', ['start', '-d', `-p ${PORT}`], options);
    return { awaitForNocoBase };
  }

  // 加上 -f 会清空数据库
  console.log('yarn nocobase install -f');
  await runCommand('yarn', ['nocobase', 'install', '-f'], options);

  if (await checkPort(PORT)) {
    console.log('Server is running, skip starting server.');
    return { awaitForNocoBase };
  }

  console.log('starting server...');
  const { cancel, kill } = runCommand('yarn', ['dev', `-p ${PORT}`, ...process.argv.slice(2)], options);

  return { cancel, kill, awaitForNocoBase };
};
