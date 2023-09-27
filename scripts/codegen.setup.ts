import { execSync } from 'node:child_process';
import { commonConfig, runNocoBase } from './utils';

const runCodegenSync = () => {
  try {
    execSync(
      `npx playwright codegen --load-storage=playwright/.auth/codegen.auth.json http://localhost:${process.env.APP_PORT} --save-storage=playwright/.auth/codegen.auth.json`,
      commonConfig,
    );
  } catch (err) {
    if (err.message.includes('auth.json')) {
      execSync(
        `npx playwright codegen http://localhost:${process.env.APP_PORT} --save-storage=playwright/.auth/codegen.auth.json`,
        commonConfig,
      );
    } else {
      console.error(err);
    }
  }
};

const run = async () => {
  const { kill } = await runNocoBase();

  if (kill) {
    // 等待服务成功启动
    setTimeout(() => {
      console.log('Starting codegen...');
      runCodegenSync();
      kill?.('SIGKILL');
    }, 5000);
  } else {
    console.log('Starting codegen...');
    runCodegenSync();
  }
};

void run();
