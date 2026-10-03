import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';

const spawnMock = vi.hoisted(() => vi.fn());

vi.mock('node:child_process', () => ({
  spawn: spawnMock,
}));

import {
  runDatabaseIntegration,
  runWithDatabaseService,
} from '../../src/integration-runner.js';

interface FakeProcess extends EventEmitter {
  stdout: PassThrough | null;
  kill: ReturnType<typeof vi.fn>;
}

function createFakeProcess(
  output = '',
  code = 0,
  signal: NodeJS.Signals | null = null,
): FakeProcess {
  const child = new EventEmitter() as FakeProcess;
  child.stdout = new PassThrough();
  child.kill = vi.fn();
  queueMicrotask(() => {
    if (output) child.stdout?.end(output);
    else child.stdout?.end();
    child.emit('close', code, signal);
  });
  return child;
}

function invocation(index: number): {
  command: string;
  args: string[];
  options: { env?: NodeJS.ProcessEnv };
} {
  const [command, args, options] = spawnMock.mock.calls[index];
  return { command, args, options };
}

function isPortCommand(args: string[]): boolean {
  return args.at(-3) === 'port';
}

afterEach(() => {
  spawnMock.mockReset();
  delete process.env.KEEP_TEST_DB;
});

describe('runDatabaseIntegration', () => {
  it('isolates the compose project, injects its published port, and cleans up', async () => {
    const environments: NodeJS.ProcessEnv[] = [];
    spawnMock.mockImplementation(
      (
        command: string,
        args: string[],
        options: { env?: NodeJS.ProcessEnv },
      ) => {
        if (command === 'docker' && isPortCommand(args))
          return createFakeProcess('127.0.0.1:49152\n');
        if (command === 'pnpm') environments.push(options.env ?? {});
        return createFakeProcess();
      },
    );

    const exitCode = await runDatabaseIntegration({
      name: 'mysql',
      composeFile: '/tmp/mysql-compose.yml',
      service: 'mysql',
      containerPort: 3306,
      hostEnvironmentVariable: 'MYSQL_HOST',
      portEnvironmentVariable: 'MYSQL_PORT',
      testEnvironment: { MYSQL_PASSWORD: 'custom' },
    });

    expect(exitCode).toBe(0);
    expect(spawnMock).toHaveBeenCalledTimes(5);
    expect(invocation(0).args).toEqual([
      'compose',
      '--project-name',
      expect.stringMatching(/^nocobase-mysql-\d+-[a-z0-9]+$/),
      '--file',
      '/tmp/mysql-compose.yml',
      'down',
      '--volumes',
      '--remove-orphans',
    ]);
    expect(invocation(1).args).toEqual([
      'compose',
      '--project-name',
      expect.any(String),
      '--file',
      '/tmp/mysql-compose.yml',
      'up',
      '--detach',
      '--wait',
      'mysql',
    ]);
    expect(invocation(2).args).toEqual([
      'compose',
      '--project-name',
      expect.any(String),
      '--file',
      '/tmp/mysql-compose.yml',
      'port',
      'mysql',
      '3306',
    ]);
    expect(invocation(3).args).toEqual([
      'exec',
      'vitest',
      'run',
      'tests/integration/core-suite.test.ts',
      '--reporter=verbose',
    ]);
    expect(environments[0]).toMatchObject({
      MYSQL_HOST: '127.0.0.1',
      MYSQL_PORT: '49152',
      MYSQL_PASSWORD: 'custom',
    });
    expect(invocation(4).args).toEqual([
      'compose',
      '--project-name',
      expect.any(String),
      '--file',
      '/tmp/mysql-compose.yml',
      'down',
      '--volumes',
      '--remove-orphans',
    ]);
  });

  it('runs init services after the database is healthy and cleans up failures', async () => {
    spawnMock.mockImplementation((command: string, args: string[]) => {
      if (command === 'docker' && isPortCommand(args))
        return createFakeProcess('127.0.0.1:49153\n');
      if (command === 'pnpm') return createFakeProcess('', 1);
      return createFakeProcess();
    });

    const exitCode = await runDatabaseIntegration({
      name: 'mssql',
      composeFile: '/tmp/mssql-compose.yml',
      service: 'mssql',
      containerPort: 1433,
      hostEnvironmentVariable: 'MSSQL_HOST',
      portEnvironmentVariable: 'MSSQL_PORT',
      initServices: ['mssql-init'],
    });

    expect(exitCode).toBe(1);
    expect(spawnMock).toHaveBeenCalledTimes(6);
    expect(invocation(2).args).toEqual([
      'compose',
      '--project-name',
      expect.any(String),
      '--file',
      '/tmp/mssql-compose.yml',
      'run',
      '--rm',
      'mssql-init',
    ]);
    expect(invocation(5).args).toEqual([
      'compose',
      '--project-name',
      expect.any(String),
      '--file',
      '/tmp/mssql-compose.yml',
      'down',
      '--volumes',
      '--remove-orphans',
    ]);
  });

  it('forwards selected Vitest files and arguments to the integration suite', async () => {
    spawnMock.mockImplementation((command: string, args: string[]) => {
      if (command === 'docker' && isPortCommand(args))
        return createFakeProcess('127.0.0.1:49155\n');
      return createFakeProcess();
    });

    const exitCode = await runDatabaseIntegration({
      name: 'mysql',
      composeFile: '/tmp/mysql-compose.yml',
      service: 'mysql',
      containerPort: 3306,
      hostEnvironmentVariable: 'MYSQL_HOST',
      portEnvironmentVariable: 'MYSQL_PORT',
      testArguments: [
        '--test-file',
        'tests/integration/schema/inspector.test.ts',
        '-t',
        'indexes',
      ],
    });

    expect(exitCode).toBe(0);
    expect(invocation(3).args).toEqual([
      'exec',
      'vitest',
      'run',
      'tests/integration/core-suite.test.ts',
      '--reporter=verbose',
      '-t',
      'indexes',
    ]);
    expect(invocation(3).options.env).toMatchObject({
      DB_TEST_FILES: JSON.stringify([
        'tests/integration/schema/inspector.test.ts',
      ]),
    });
  });

  it('keeps the project when requested for debugging', async () => {
    process.env.KEEP_TEST_DB = '1';
    spawnMock.mockImplementation((command: string, args: string[]) => {
      if (command === 'docker' && isPortCommand(args))
        return createFakeProcess('127.0.0.1:49154\n');
      return createFakeProcess();
    });

    const exitCode = await runDatabaseIntegration({
      name: 'postgres',
      composeFile: '/tmp/postgres-compose.yml',
      service: 'postgres',
      containerPort: 5432,
      hostEnvironmentVariable: 'POSTGRES_HOST',
      portEnvironmentVariable: 'POSTGRES_PORT',
    });

    expect(exitCode).toBe(0);
    expect(spawnMock).toHaveBeenCalledTimes(4);
    expect(invocation(3).args).toEqual([
      'exec',
      'vitest',
      'run',
      'tests/integration/core-suite.test.ts',
      '--reporter=verbose',
    ]);
  });

  it('keeps the project after a failed run with pause-on-failure', async () => {
    spawnMock.mockImplementation((command: string, args: string[]) => {
      if (command === 'docker' && isPortCommand(args))
        return createFakeProcess('127.0.0.1:49156\n');
      if (command === 'pnpm') return createFakeProcess('', 1);
      return createFakeProcess();
    });

    const exitCode = await runDatabaseIntegration({
      name: 'postgres',
      composeFile: '/tmp/postgres-compose.yml',
      service: 'postgres',
      containerPort: 5432,
      hostEnvironmentVariable: 'POSTGRES_HOST',
      portEnvironmentVariable: 'POSTGRES_PORT',
      testArguments: [
        '--test-file',
        'tests/integration/schema/inspector.test.ts',
        '--pause-on-failure',
      ],
    });

    expect(exitCode).toBe(1);
    expect(invocation(3).args).toEqual([
      'exec',
      'vitest',
      'run',
      'tests/integration/core-suite.test.ts',
      '--reporter=verbose',
    ]);
    expect(spawnMock).toHaveBeenCalledTimes(4);
  });
});

describe('runWithDatabaseService', () => {
  it('runs the given command with the service address and its own environment', async () => {
    const commands: Array<{ args: string[]; env: NodeJS.ProcessEnv }> = [];
    spawnMock.mockImplementation(
      (
        command: string,
        args: string[],
        options: { env?: NodeJS.ProcessEnv },
      ) => {
        if (command === 'docker' && isPortCommand(args))
          return createFakeProcess('127.0.0.1:49160\n');
        if (command === 'pnpm') commands.push({ args, env: options.env ?? {} });
        return createFakeProcess('', command === 'pnpm' ? 3 : 0);
      },
    );

    const exitCode = await runWithDatabaseService({
      name: 'postgres',
      composeFile: '/tmp/postgres-compose.yml',
      service: 'postgres',
      containerPort: 5432,
      hostEnvironmentVariable: 'POSTGRES_HOST',
      portEnvironmentVariable: 'POSTGRES_PORT',
      command: 'pnpm',
      args: ['--filter', '@nocobase/app-plugin-scheduler', 'run', 'test'],
      environment: { NOCOBASE_TEST_DB_DIALECT: 'postgres' },
    });

    expect(exitCode).toBe(3);
    expect(commands).toEqual([
      {
        args: ['--filter', '@nocobase/app-plugin-scheduler', 'run', 'test'],
        env: expect.objectContaining({
          POSTGRES_HOST: '127.0.0.1',
          POSTGRES_PORT: '49160',
          NOCOBASE_TEST_DB_DIALECT: 'postgres',
        }),
      },
    ]);
    expect(invocation(spawnMock.mock.calls.length - 1).args).toEqual(
      expect.arrayContaining(['down', '--volumes', '--remove-orphans']),
    );
  });
});
