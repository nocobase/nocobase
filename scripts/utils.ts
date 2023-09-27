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

  if (process.env.CI) {
    console.log('yarn nocobase install');
    await runCommand('yarn', ['nocobase', 'install'], options);
    console.log(`yarn start -d -p ${process.env.APP_PORT}`);
    await runCommand('yarn', ['start', '-d', `-p ${process.env.APP_PORT}`], options);
    return {};
  }

  if (await checkPort(process.env.APP_PORT)) {
    console.log('Server is running, skip starting server.');
    return {};
  }

  // 加上 -f 会清空数据库
  console.log('yarn nocobase install -f');
  await runCommand('yarn', ['nocobase', 'install', '-f'], options);

  console.log('starting server...');
  const { cancel, kill } = runCommand('yarn', ['dev', `-p ${process.env.APP_PORT}`, ...process.argv.slice(2)], options);

  return { cancel, kill };
};
