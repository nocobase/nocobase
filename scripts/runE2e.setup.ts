import { execSync } from 'node:child_process';
import { commonConfig, runNocoBase } from './utils';

const run = async () => {
  const { kill } = await runNocoBase({
    stdio: 'ignore', // 不输出服务的日志，避免干扰测试的日志
  });

  // 等待服务成功启动
  setTimeout(() => {
    execSync(`npx playwright test`, commonConfig);
    kill?.('SIGKILL');
  }, 5000);
};

run();
