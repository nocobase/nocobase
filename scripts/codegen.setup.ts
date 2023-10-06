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
  const { kill, awaitForNocoBase } = await runNocoBase();

  await awaitForNocoBase();

  console.log('Starting codegen...');
  runCodegenSync();
  kill?.('SIGKILL');
};

run();
