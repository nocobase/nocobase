import { runCommand, runNocoBase } from './utils';

const run = async () => {
  const { kill, awaitForNocoBase } = await runNocoBase({
    stdio: 'ignore', // 不输出服务的日志，避免干扰测试的日志
  });

  await awaitForNocoBase();

  console.log('Start running tests...');
  runCommand('npx', ['playwright', 'test', ...process.argv.slice(2)]);
  kill?.('SIGKILL');
};

run();
