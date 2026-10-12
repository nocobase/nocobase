import { writeFile } from 'node:fs/promises';
import { Writable } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runRemote, sshArgs } from '../src/lib/remote.ts';
import { CommandFailedError, type RunCommand } from '../src/lib/run-command.ts';
import {
  createReporter,
  errorEnvelope,
  formatError,
} from '../src/lib/output.ts';
import { confirm } from '../src/lib/confirm.ts';
import { interruptError } from '../src/lib/interrupt.ts';
import { InstallerError } from '../src/lib/errors.ts';
import { installerCommandLine } from '../src/lib/invocation.ts';
import { fileURLToPath } from 'node:url';
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
  it('shows the real rollback confirmation notes in human-readable output', async () => {
    const warning =
      'The SQLite databases are restored from the backup: whatever was written since that upgrade is lost.';
    const failure = await confirm(['Roll back the application.', warning], {
      yes: false,
      json: true,
    }).catch((error: unknown) => error);
    const run = vi
      .fn<RunCommand>()
      .mockImplementation(async (_command, args) => {
        if (args.at(-1)?.includes('remote-entry.js'))
          throw new CommandFailedError(
            'ssh',
            2,
            JSON.stringify(errorEnvelope('rollback', failure, [])),
            '',
          );
        return { stdout: '', stderr: '' };
      });
    const error: unknown = await runRemote(
      'rollback',
      { ...flags, json: false },
      undefined,
      [],
      { run, pm2: createPm2(), reporter: reporter() },
    ).catch((error: unknown) => error);
    expect(error).toBeInstanceOf(InstallerError);
    expect(formatError(error)).toContain(warning);
    expect(errorEnvelope('rollback', error, [])).toMatchObject({
      error: {
        suggestions: [
          { message: 'Run it again with --yes once you have read:' },
          { message: warning },
        ],
      },
    });
  });
  it('preserves recovery advice and routes commands to the appropriate machine', async () => {
    const connection = {
      ...flags,
      'ssh-port': 2222,
      'ssh-identity': '/keys/private key',
      'ssh-config': '/config/ssh',
      'ssh-timeout': 60,
    };
    const suggestions = [
      {
        message: 'Read the remote log.',
        run: {
          command: 'tail',
          args: ['-n', '100', "/srv/my app/error's.log"],
        },
      },
      {
        message: 'Recover the interrupted upgrade.',
        run: installerCommandLine(['rollback', '--dir', flags.dir]),
      },
      {
        message: 'Build the archive.',
        run: { command: 'pnpm', args: ['build', '--tar'] },
      },
    ];
    const run = vi
      .fn<RunCommand>()
      .mockImplementation(async (_command, args) => {
        if (args.at(-1)?.includes('remote-entry.js'))
          throw new CommandFailedError(
            'ssh',
            4,
            JSON.stringify(
              errorEnvelope(
                'rollback',
                new InstallerError('ROLLBACK_FAILED', 'Recovery failed.', {
                  suggestions,
                }),
                [],
              ),
            ),
            '',
          );
        return { stdout: '', stderr: '' };
      });
    const error: unknown = await runRemote(
      'rollback',
      connection,
      undefined,
      [],
      { run, pm2: createPm2(), reporter: reporter() },
    ).catch((error: unknown) => error);
    expect(error).toBeInstanceOf(InstallerError);
    const advice = (error as InstallerError).suggestions;
    expect(advice[0]).toMatchObject({
      message: suggestions[0].message,
      run: {
        command: 'ssh',
        args: [
          ...sshArgs(connection),
          flags.ssh,
          "tail -n 100 '/srv/my app/error'\\''s.log'",
        ],
      },
    });
    expect(advice[1]).toEqual({
      message: suggestions[1].message,
      run: {
        command: process.execPath,
        args: [
          fileURLToPath(new URL('../bin/run.js', import.meta.url)),
          'rollback',
          '--dir',
          flags.dir,
          '--ssh',
          flags.ssh,
          '--ssh-port',
          '2222',
          '--ssh-identity',
          '/keys/private key',
          '--ssh-config',
          '/config/ssh',
          '--ssh-timeout',
          '60',
        ],
      },
    });
    expect(advice[2]).toEqual({
      message: 'In the local application project: Build the archive.',
      run: suggestions[2].run,
    });
    expect(
      advice.some((suggestion) =>
        suggestion.message.includes('Retry the same'),
      ),
    ).toBe(false);
  });
  it('preserves an interruption result returned by the remote installer', async () => {
    const run = vi
      .fn<RunCommand>()
      .mockImplementation(async (_command, args) => {
        if (args.at(-1)?.includes('remote-entry.js'))
          throw new CommandFailedError(
            'ssh',
            1,
            JSON.stringify(errorEnvelope('rollback', interruptError(), [])),
            '',
          );
        return { stdout: '', stderr: '' };
      });
    await expect(
      runRemote('rollback', flags, undefined, [], {
        run,
        pm2: createPm2(),
        reporter: reporter(),
      }),
    ).rejects.toMatchObject({
      code: 'INTERRUPTED',
      details: { ssh: flags.ssh, directory: flags.dir },
    });
  });
  it.each([false, true])(
    'handles a local interrupt with execution started=%s',
    async (executing) => {
      const run = vi
        .fn<RunCommand>()
        .mockImplementation(async (_command, args) => {
          if (!executing || args.at(-1)?.includes('remote-entry.js'))
            throw interruptError();
          return { stdout: '', stderr: '' };
        });
      const error: unknown = await runRemote('rollback', flags, undefined, [], {
        run,
        pm2: createPm2(),
        reporter: reporter(),
      }).catch((error: unknown) => error);
      expect(error).toMatchObject({
        code: executing ? 'REMOTE_STATE_UNKNOWN' : 'INTERRUPTED',
      });
      if (executing) {
        expect(error).toMatchObject({
          message: expect.stringContaining('query status before retrying'),
          details: {
            ssh: flags.ssh,
            directory: flags.dir,
            staging: expect.stringMatching(/^\/tmp\/nocobase-deploy-/u),
          },
        });
        expect(
          run.mock.calls.filter((call) =>
            call[1].at(-1)?.includes('remote-entry.js'),
          ),
        ).toHaveLength(1);
        expect(
          run.mock.calls.some((call) => call[1].at(-1)?.includes('rm -rf')),
        ).toBe(false);
      }
    },
  );
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
