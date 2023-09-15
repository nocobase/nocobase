import { execSync } from 'node:child_process';
import { PORT, commonConfig, runNocoBase } from './utils';

const run = async () => {
  const { kill } = await runNocoBase();

  // 等待服务成功启动
  setTimeout(() => {
    try {
      execSync(
        `npx playwright codegen --load-storage=playwright/.auth/codegen.auth.json http://localhost:${PORT} --save-storage=playwright/.auth/codegen.auth.json`,
        commonConfig,
      );
    } catch (err) {
      if (err.message.includes('auth.json')) {
        execSync(
          `npx playwright codegen http://localhost:${PORT} --save-storage=playwright/.auth/codegen.auth.json`,
          commonConfig,
        );
      } else {
        console.error(err);
      }
    } finally {
      kill?.('SIGKILL');
    }
  }, 5000);
};

run();
