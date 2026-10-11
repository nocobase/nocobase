import { writeFile } from 'node:fs/promises';
import { Writable } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runRemote, sshArgs } from '../src/lib/remote.ts';
import { CommandFailedError, type RunCommand } from '../src/lib/run-command.ts';
import { createReporter } from '../src/lib/output.ts';
import { createPm2 } from '../src/lib/pm2.ts';

vi.mock('../src/lib/offline-bundle.ts', () => ({
  createOfflineBundle: async (file: string) =>
    writeFile(file, 'installer fixture'),
}));
const reporter = () =>
  createReporter(
    true,
    new Writable({
      write(_c, _e, cb) {
        cb();
      },
    }),
  );
const flags = { ssh: 'deploy@server', dir: '/srv/my app', json: true };
afterEach(() => {
  delete process.env.TEST_REMOTE_PASSWORD;
});

describe('SSH transport', () => {
  it('uses SSH configuration and rejects option or shell injection', () => {
    expect(
      sshArgs({
        ...flags,
        'ssh-port': 2222,
        'ssh-identity': '/keys/key with spaces',
      }),
    ).toContain('2222');
    for (const ssh of [
      '-oProxyCommand=evil',
      'host; touch /tmp/oops',
      'ssh://host',
      'user@host\ncmd',
    ])
      expect(() => sshArgs({ ssh })).toThrow();
  });
  it('preserves successful remote results without requiring remote npm', async () => {
    const run = vi
      .fn<RunCommand>()
      .mockImplementation(async (command, args) => ({
        stdout:
          command === 'ssh' && args.at(-1)?.includes('remote-entry.js')
            ? JSON.stringify({
                ok: true,
                status: 'success',
                result: { version: 'test-version', health: { ok: true } },
                warnings: [],
              })
            : '',
        stderr: '',
      }));
    const outcome = await runRemote('status', flags, undefined, [], {
      run,
      pm2: createPm2(),
      reporter: reporter(),
    });
    expect(outcome.result).toMatchObject({
      version: 'test-version',
      remote: { host: 'deploy@server' },
    });
    expect(run.mock.calls.flatMap((c) => c[1]).join(' ')).not.toContain('npx');
  });
  it.each(['secret-not-in-args', 'secret"with\\escapes'])(
    'transports secrets only on stdin and redacts remote errors: %s',
    async (secret) => {
      process.env.TEST_REMOTE_PASSWORD = secret;
      const run = vi
        .fn<RunCommand>()
        .mockImplementation(async (command, args) => {
          if (command === 'ssh' && args.at(-1)?.includes('remote-entry.js'))
            throw new CommandFailedError(
              'ssh',
              2,
              JSON.stringify({
                ok: false,
                error: {
                  code: 'CONFIRMATION_REQUIRED',
                  message: secret,
                  details: { notes: ['review backup'] },
                },
              }),
              '',
            );
          return { stdout: '', stderr: '' };
        });
      await expect(
        runRemote(
          'status',
          {
            ...flags,
            'set-from-env': [
              'users.initialAdmin.password=TEST_REMOTE_PASSWORD',
            ],
          },
          undefined,
          [],
          { run, pm2: createPm2(), reporter: reporter() },
        ),
      ).rejects.toMatchObject({
        code: 'CONFIRMATION_REQUIRED',
        exitCode: 2,
        message: '[REDACTED]',
        details: { notes: ['review backup'] },
      });
      expect(run.mock.calls.flatMap((c) => c[1]).join(' ')).not.toContain(
        secret,
      );
      const execution = run.mock.calls.find((c) =>
        c[1].at(-1)?.includes('remote-entry.js'),
      );
      expect(JSON.parse(execution![2]!.input!).env).toEqual({
        NOCOBASE_REMOTE_SECRET_0: secret,
      });
    },
  );
  it('does not retry an uncertain SSH execution', async () => {
    const run = vi
      .fn<RunCommand>()
      .mockImplementation(async (command, args) => {
        if (command === 'ssh' && args.at(-1)?.includes('remote-entry.js'))
          throw new CommandFailedError('ssh', 255, '', 'Connection closed');
        return { stdout: '', stderr: '' };
      });
    await expect(
      runRemote('status', flags, undefined, [], {
        run,
        pm2: createPm2(),
        reporter: reporter(),
      }),
    ).rejects.toMatchObject({ code: 'REMOTE_STATE_UNKNOWN' });
    expect(
      run.mock.calls.filter((c) => c[1].at(-1)?.includes('remote-entry.js')),
    ).toHaveLength(1);
  });
  it('rejects remote npm builds and relative target paths before connecting', async () => {
    const run = vi.fn<RunCommand>();
    for (const values of [
      { ...flags, dir: 'relative' },
      { ...flags, app: 'studio@beta' },
    ])
      await expect(
        runRemote('install', values, undefined, [], {
          run,
          pm2: createPm2(),
          reporter: reporter(),
        }),
      ).rejects.toMatchObject({ code: 'INVALID_USAGE' });
    expect(run).not.toHaveBeenCalled();
  });
});
