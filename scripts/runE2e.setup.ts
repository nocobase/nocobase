import { runCommand, runNocoBase } from './utils';

const abortController = new AbortController();

process.on('SIGINT', () => {
  abortController.abort();
  process.exit();
});

const run = async () => {
  const { awaitForNocoBase } = await runNocoBase({
    stdio: 'ignore', // 不输出服务的日志，避免干扰测试的日志
    signal: abortController.signal,
  });

  await awaitForNocoBase();

  console.log('Start running tests...');
  await runCommand('npx', ['playwright', 'test', ...process.argv.slice(2)]);
  abortController.abort();
};

run();
