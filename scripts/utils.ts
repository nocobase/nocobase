import { execSync } from 'node:child_process';
import fs from 'node:fs';

export const PORT = 20000;
export const APP_DIRECTORY = 'my-nocobase-app';

export const commonConfig: any = {
  stdio: 'inherit',
};

export const deleteNocoBase = () => {
  execSync(`yarn pm2 delete 0`, commonConfig);
};

export const runNocoBase = () => {
  if (!fs.existsSync('playwright')) {
    fs.mkdirSync('playwright');
  }

  process.chdir('playwright');

  // 检查文件夹是否存在
  if (!fs.existsSync(APP_DIRECTORY)) {
    try {
      execSync(`yarn create nocobase-app ${APP_DIRECTORY}`, commonConfig);
    } catch (error) {
      console.error('Error creating directory:', error);
      process.exit(1);
    }
  }

  try {
    process.chdir(APP_DIRECTORY);

    if (!fs.existsSync('node_modules')) {
      // 只安装必要的依赖
      execSync('yarn install --production', commonConfig);
    }

    // 加上 -f 比较保险
    execSync('yarn nocobase install -f', commonConfig);
    // 加参数 -d，后台运行
    execSync(`yarn start -p ${PORT} ${process.argv.slice(2).join(' ')}`, commonConfig);

    process.chdir('..');
  } catch (error) {
    console.error('Script execution error:', error);
  }
};
