import axios from 'axios';
import dotenv from 'dotenv';
import type { CommonOptions } from 'execa';
import execa from 'execa';
import net from 'net';
import fs from 'node:fs';
import path from 'path';

export const commonConfig: any = {
  stdio: 'inherit',
};

export const runCommand = (command, argv, options = {}) => {
  return execa(command, argv, {
    shell: true,
    stdio: 'inherit',
    ...options,
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

      if (!(await checkPort(process.env.APP_PORT))) {
        return;
      }

      axios
        .get(`http://localhost:${process.env.APP_PORT}/api/__health_check`)
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
        .get(`http://localhost:${process.env.APP_PORT}/__umi/api/bundle-status`)
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

export const runNocoBase = async (options?: CommonOptions<any>) => {
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
    console.log(`yarn start -d -p ${process.env.APP_PORT}`);
    await runCommand('yarn', ['start', '-d', `-p ${process.env.APP_PORT}`], options);
    return { awaitForNocoBase };
  }

  // 加上 -f 会清空数据库
  console.log('yarn nocobase install -f');
  await runCommand('yarn', ['nocobase', 'install', '-f'], options);

  if (await checkPort(process.env.APP_PORT)) {
    console.log('Server is running, skip starting server.');
    return { awaitForNocoBase };
  }

  console.log('starting server...');
  const { cancel, kill } = runCommand('yarn', ['dev', `-p ${process.env.APP_PORT}`, ...process.argv.slice(2)], options);

  return { cancel, kill, awaitForNocoBase };
};
