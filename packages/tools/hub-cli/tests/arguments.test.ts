// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CommandError } from '@nocobase/app-cli';
import {
  bindAppCommand,
  runAppCommand,
  type AppCommandRun,
} from '@nocobase/app-cli/testing';

import Deploy from '../src/cli/deploy.ts';
import Upload from '../src/cli/upload.ts';
import {
  DEFAULT_ARTIFACT,
  publishRelease,
  type ReleaseDeployResult,
  type ReleaseUploadResult,
} from '../src/hub-publishing.ts';

vi.mock('../src/hub-publishing.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/hub-publishing.ts')>()),
  publishRelease: vi.fn(),
}));

const secret = 'test-only-argument-secret';
let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'hub-arguments-'));
});
afterEach(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.mocked(publishRelease).mockReset();
  await rm(root, { recursive: true, force: true });
});

function run(
  operation: 'upload' | 'deploy',
  argv: readonly string[],
): Promise<AppCommandRun> {
  const Command = bindAppCommand(operation === 'deploy' ? Deploy : Upload, {
    rootDir: root,
    // The id the runner registers the command under, which the --json document names it by.
    id: `hub:${operation}`,
  });
  return runAppCommand(Command, argv);
}

const uploaded: ReleaseUploadResult = {
  releaseId: 'r1',
  checksum: 'abc',
  size: 8,
  version: '1.0.0',
  reused: false,
  operationId: null,
  idempotencyKey: 'abc',
};

const argumentErrors = [
  ['deploy', ['--timeout', secret], 'Invalid value for --timeout.'],
  ['upload', ['--timeout', secret], 'Invalid value for --timeout.'],
  ['upload', ['--deploy'], 'Unknown flag --deploy.'],
  ['upload', ['--apikey', secret], 'Unknown flag --apikey.'],
  ['upload', [`--apikey=${secret}`], 'Unknown flag --apikey.'],
  ['upload', [secret], 'This command takes no positional arguments.'],
] as const;

describe('hub argument errors', () => {
  it.each(argumentErrors)(
    '%s %j names the flag without echoing the value',
    async (operation, argv, message) => {
      const result = await run(operation, ['--json', ...argv]);

      expect(result.exitCode).toBe(2);
      // The same code and handling as every other command's usage errors, suggestions included.
      expect(result.json()).toMatchObject({
        schemaVersion: 1,
        ok: false,
        command: `hub ${operation}`,
        status: 'failure',
        error: {
          code: 'INVALID_USAGE',
          message,
          suggestions: expect.arrayContaining([
            {
              message: expect.stringMatching(/^See the command's/u),
              run: {
                command: 'pnpm',
                args: ['nocobase', 'hub', operation, '--help'],
              },
            },
          ]),
        },
        warnings: [],
      });
      expect(result.stdout + result.stderr).not.toContain(secret);
      expect(publishRelease).not.toHaveBeenCalled();
    },
  );

  it.each(argumentErrors)(
    '%s %j without --json throws invalid usage that does not echo the value',
    async (operation, argv, message) => {
      const result = await run(operation, argv);

      expect(result.error).toBeInstanceOf(CommandError);
      expect(result.error).toMatchObject({
        message,
        errorCode: 'INVALID_USAGE',
        oclif: { exit: 2 },
      });
      expect(JSON.stringify(result.error)).not.toContain(secret);
      expect(result.stdout + result.stderr).not.toContain(secret);
    },
  );
});

describe('unexpected hub failures', () => {
  const argv = [
    '--hub',
    'https://hub.example/main',
    '--app-id',
    'crm',
    '--api-key',
    secret,
    '--release-id',
    'r1',
    '--no-wait',
  ];

  it('reports a fixed message and prints the cause only when NOCOBASE_CLI_DEBUG is set', async () => {
    // Anything that is not a PublishingError, whose message may quote a request, a response or the environment.
    vi.mocked(publishRelease).mockRejectedValue(
      new Error(`cause containing ${secret}`),
    );

    vi.stubEnv('NOCOBASE_CLI_DEBUG', '');
    const quiet = await run('deploy', ['--json', ...argv]);
    expect(quiet.exitCode).toBe(1);
    expect(quiet.json()).toMatchObject({
      ok: false,
      command: 'hub deploy',
      error: {
        code: 'DEPLOY_FAILED',
        message:
          'Deployment failed. Set NOCOBASE_CLI_DEBUG=1 to print the cause.',
      },
    });
    expect(quiet.stdout + quiet.stderr).not.toContain(secret);

    vi.stubEnv('NOCOBASE_CLI_DEBUG', '1');
    const debugJson = await run('deploy', ['--json', ...argv]);
    expect(debugJson.stdout).not.toContain(secret);
    // Under --json the document stays clean, and the cause still reaches whoever is watching stderr.
    expect(debugJson.stderr).toContain('cause containing');

    // stderr is for people, and the cause goes there only for one who opted in.
    const debug = await run('deploy', argv);
    expect(debug.error).toMatchObject({ errorCode: 'DEPLOY_FAILED' });
    expect(JSON.stringify(debug.error)).not.toContain(secret);
    expect(debug.stdout).not.toContain(secret);
    expect(debug.stderr).toContain('cause containing');
  });

  it('names the command and puts the Hub result under result', async () => {
    vi.mocked(publishRelease).mockResolvedValue({
      result: uploaded,
      warning: undefined,
    });

    const result = await run('upload', ['--json', ...argv.slice(0, 6)]);

    expect(result.exitCode).toBeUndefined();
    expect(result.json()).toEqual({
      schemaVersion: 1,
      ok: true,
      command: 'hub upload',
      status: 'success',
      result: uploaded,
      warnings: [],
    });
  });

  it('reports a reused deployment as a no-op with its warning', async () => {
    const deployed: ReleaseDeployResult = {
      releaseId: 'r1',
      operationId: 'op-1',
      operationStatus: 'succeeded',
      idempotencyKey: 'key',
      reused: true,
    };
    vi.mocked(publishRelease).mockResolvedValue({
      result: deployed,
      warning: 'Hub reused an earlier deployment.',
    });

    const result = await run('deploy', ['--json', ...argv]);

    expect(result.json()).toEqual({
      schemaVersion: 1,
      ok: true,
      command: 'hub deploy',
      status: 'success-noop',
      result: deployed,
      warnings: ['Hub reused an earlier deployment.'],
    });
  });
});

describe('hub path flags', () => {
  const connection = [
    '--hub',
    'https://hub.example/main',
    '--app-id',
    'crm',
    '--api-key',
    secret,
  ];

  it('reads the default archive from the application root, wherever the command runs', async () => {
    vi.mocked(publishRelease).mockResolvedValue({
      result: uploaded,
      warning: undefined,
    });
    vi.spyOn(process, 'cwd').mockReturnValue('/work/elsewhere');

    await run('upload', ['--json', ...connection]);

    expect(publishRelease).toHaveBeenCalledWith(
      'upload',
      expect.objectContaining({ file: path.join(root, DEFAULT_ARTIFACT) }),
      root,
    );
    expect(vi.mocked(publishRelease).mock.calls[0]?.[1].config).toBeUndefined();
  });

  it('resolves a typed --file and --config from the current directory', async () => {
    vi.mocked(publishRelease).mockResolvedValue({
      result: uploaded,
      warning: undefined,
    });
    vi.spyOn(process, 'cwd').mockReturnValue('/work/crm/client');

    await run('deploy', [
      '--json',
      ...connection,
      '--file',
      '../artifacts/dist.tar.gz',
      '--config',
      'runtime.yml',
    ]);

    expect(publishRelease).toHaveBeenCalledWith(
      'upload',
      expect.objectContaining({
        file: '/work/crm/artifacts/dist.tar.gz',
        config: '/work/crm/client/runtime.yml',
      }),
      root,
    );
  });
});

describe('what hub deploy sends', () => {
  const connection = [
    '--hub',
    'https://hub.example/main',
    '--app-id',
    'crm',
    '--api-key',
    secret,
  ];

  it('uploads the archive and deploys it when no Release is named', async () => {
    vi.mocked(publishRelease).mockResolvedValue({
      result: {
        ...uploaded,
        operationId: 'op-1',
        operationStatus: 'succeeded',
      },
      warning: undefined,
    });

    const result = await run('deploy', ['--json', ...connection]);

    expect(result.json()).toMatchObject({ ok: true, command: 'hub deploy' });
    expect(publishRelease).toHaveBeenCalledWith(
      'upload',
      expect.objectContaining({
        deploy: true,
        wait: true,
        file: path.join(root, DEFAULT_ARTIFACT),
      }),
      root,
    );
  });

  it('deploys a named Release without uploading anything', async () => {
    vi.mocked(publishRelease).mockResolvedValue({
      result: {
        releaseId: 'r1',
        operationId: 'op-1',
        operationStatus: 'queued',
        idempotencyKey: 'key',
      },
      warning: undefined,
    });

    await run('deploy', [
      '--json',
      ...connection,
      '--release-id',
      'r1',
      '--no-wait',
    ]);

    expect(publishRelease).toHaveBeenCalledWith(
      'deploy',
      expect.objectContaining({ 'release-id': 'r1', wait: false }),
      root,
    );
  });

  it('refuses an archive together with a Release to deploy', async () => {
    const result = await run('deploy', [
      '--json',
      ...connection,
      '--release-id',
      'r1',
      '--file',
      'dist.tar.gz',
    ]);

    expect(result.exitCode).toBe(2);
    expect(result.json()).toMatchObject({
      ok: false,
      command: 'hub deploy',
      error: { code: 'INVALID_USAGE' },
    });
    expect(result.stdout + result.stderr).not.toContain('dist.tar.gz');
    expect(publishRelease).not.toHaveBeenCalled();
  });

  it('never deploys from hub upload', async () => {
    vi.mocked(publishRelease).mockResolvedValue({
      result: uploaded,
      warning: undefined,
    });

    await run('upload', ['--json', ...connection]);

    expect(vi.mocked(publishRelease).mock.calls[0]?.[1].deploy).toBeUndefined();
  });
});
