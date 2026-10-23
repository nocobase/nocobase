import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import path from 'node:path';
import { createTestAppConfig } from '@nocobase/app-testing/server';

// Run from the Examples directory after building. All credentials, databases and storage are disposable.
const listener = createServer();
await new Promise<void>((resolve) => listener.listen(0, '127.0.0.1', resolve));
const address = listener.address();
if (!address || typeof address === 'string')
  throw new Error('No fixture port.');
const port = address.port;
await new Promise<void>((resolve) => listener.close(() => resolve()));
const origin = `http://127.0.0.1:${port}`;
const username = 'reasoning_admin';
const password = randomBytes(24).toString('hex');
const config = await createTestAppConfig({
  env: { NOCOBASE_TEST_DB_DIALECT: 'sqlite' },
  connections: ['main', 'analytics'],
  config: {
    app: { publicOrigin: origin },
    auth: { secret: randomBytes(32).toString('hex'), trustedOrigins: [origin] },
    secrets: { keys: [{ version: 1, key: randomBytes(32).toString('hex') }] },
    users: {
      initialAdmin: { username, email: 'reasoning@example.test', password },
    },
    agents: { vectors: { store: false } },
  },
});
// Ignore the caller's application/database environment; the owned config is the only deployment input.
const isolatedEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    ([name]) => !/^(APP_|DB_|NOCOBASE_TEST_|PROXY_TARGET_URL$)/.test(name),
  ),
);
const server = spawn(
  process.execPath,
  [
    '--experimental-import-meta-resolve',
    '--import',
    'tsx',
    'tests/fixtures/online-agent-browser-server.ts',
  ],
  {
    env: {
      ...isolatedEnv,
      APP_CONFIG_FILE: config.path,
      APP_STORAGE_DIR: path.join(config.directory, 'storage'),
      APP_SERVER_PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
const stopped = new Promise<void>((resolve) =>
  server.once('exit', () => resolve()),
);
server.stderr.pipe(process.stderr);
const ready = new Promise<string>((resolve, reject) => {
  let output = '';
  let listening = false;
  server.stdout.on('data', (chunk: Buffer) => {
    const value = chunk.toString();
    process.stdout.write(value);
    if (listening) return;
    output += value;
    const match = /Local: (http:\/\/\S+)/.exec(output);
    if (match) {
      listening = true;
      resolve(match[1]!);
    }
  });
  server.once('error', reject);
  server.once('exit', (code) =>
    reject(new Error(`Fixture exited before ready: ${code}`)),
  );
});
let tests: ReturnType<typeof spawn> | undefined;
const stop = () => {
  tests?.kill('SIGTERM');
  server.kill('SIGTERM');
};
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
try {
  const url = await Promise.race([
    ready,
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('Fixture startup timed out.')),
        120_000,
      ).unref();
    }),
  ]);
  console.log(
    `Reasoning acceptance server PID: ${server.pid}; checkout: ${process.cwd()}`,
  );
  tests = spawn(
    'pnpm',
    [
      'test:e2e',
      'tests/playwright/online-agent.test.ts',
      ...process.argv.slice(2),
    ],
    {
      env: {
        ...process.env,
        APP_URL: url.replace(/\/$/, ''),
        E2E_USERNAME: username,
        E2E_PASSWORD: password,
        PM481_BROWSER_FIXTURE: '1',
      },
      stdio: 'inherit',
    },
  );
  const code = await new Promise<number>((resolve, reject) => {
    tests!.once('error', reject);
    tests!.once('exit', (code) => resolve(code ?? 1));
  });
  process.exitCode = code;
} finally {
  stop();
  await stopped;
  await config.dispose();
  console.log(
    'Stopped the owned fixture and disposed its isolated configuration, databases and storage.',
  );
}
