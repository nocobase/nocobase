import { runCommand, runNocoBase } from './utils';

const run = async () => {
  const { kill } = await runNocoBase({
    stdio: 'ignore', // 不输出服务的日志，避免干扰测试的日志
  });

  // 等待服务成功启动
  setTimeout(() => {
    runCommand('npx', ['playwright', 'test', ...process.argv.slice(2)]);
    kill?.('SIGKILL');
  }, 5000);
};

run();
