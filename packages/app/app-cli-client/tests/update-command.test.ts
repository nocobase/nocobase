import path from 'node:path';
import { Config } from '@oclif/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureAppCli } from '../src/config.ts';
import { updateCommand } from '../src/update.ts';
import { acpCommands } from '../src/acp.ts';
import { removeDir, tempDir, TEST_CLI } from './helpers.ts';

const mocks = vi.hoisted(() => ({
  apply: vi.fn(),
  latest: vi.fn(),
  restart: vi.fn(),
  session: vi.fn(),
  findRun: vi.fn(),
}));
vi.mock('../src/dynamic/session.ts', () => ({
  currentSession: mocks.session,
}));
vi.mock('../src/lib/credentials.ts', async (original) => ({
  ...(await original<typeof import('../src/lib/credentials.ts')>()),
  findRunCredentials: mocks.findRun,
}));
vi.mock('../src/acp-service.ts', async (original) => ({
  ...(await original<typeof import('../src/acp-service.ts')>()),
  restartAcpServices: mocks.restart,
}));
vi.mock('../src/install.ts', async (original) => ({
  ...(await original<typeof import('../src/install.ts')>()),
  detectInstallation: (root: string) => ({ mode: 'cli', prefix: root }),
  applyUpdate: mocks.apply,
  latestResolution: mocks.latest,
}));

describe('update command service restart', () => {
  let home: string;
  let config: Config;
  beforeEach(async () => {
    home = tempDir();
    mocks.session.mockResolvedValue({
      kind: 'user',
      server: 'https://example.test',
      headers: { authorization: 'Bearer test-session' },
    });
    mocks.findRun.mockReturnValue(undefined);
    configureAppCli(TEST_CLI);
    config = await Config.load(path.resolve(import.meta.dirname, '..'));
    mocks.latest.mockResolvedValue({
      product: 'acme',
      version: '1.1.0',
      target: 'linux-x64',
      url: '/cli.tar.gz',
      sha256: 'hash',
      size: 1,
    });
    mocks.apply.mockResolvedValue({ previous: '1.0.0' });
    mocks.restart.mockResolvedValue({
      restarted: ['acme-acp.service'],
      warnings: [],
    });
  });
  afterEach(() => {
    process.exitCode = 0;
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    removeDir(home);
  });
  const command = () =>
    updateCommand({
      ...TEST_CLI,
      version: '1.0.0',
      selfUpdate: { packageRoot: home },
    });

  const publicCommand = () =>
    updateCommand({
      ...TEST_CLI,
      version: '1.0.0',
      selfUpdate: { packageRoot: home, public: true },
    });

  it('only enables an explicit public target when the application opts in', async () => {
    await expect(
      command().run(['--server', 'https://public.test/main'], config),
    ).rejects.toThrow();
    expect(mocks.latest).not.toHaveBeenCalled();
    mocks.session.mockResolvedValue(undefined);
    await expect(command().run([], config)).rejects.toThrow('Sign in first');
    await expect(publicCommand().run([], config)).rejects.toThrow(
      'Sign in first',
    );
    expect(mocks.latest).not.toHaveBeenCalled();
  });

  it.each([{ args: ['--check'] }, { args: [] }])(
    'updates a public target with no session or profile headers: %j',
    async ({ args }) => {
      mocks.session.mockRejectedValue(
        new Error('The keychain must not be read'),
      );
      await publicCommand().run(
        [...args, '--server', 'https://public.test/platform/main/'],
        config,
      );
      expect(mocks.session).not.toHaveBeenCalled();
      const client = mocks.latest.mock.calls[0]![0];
      expect(client.server).toBe('https://public.test/platform/main');
      const request = vi.fn(async () => new Response('{}'));
      vi.stubGlobal('fetch', request);
      await client.request('GET', '/api/agents/dist/manifest');
      const [url, options] = request.mock.calls[0]! as unknown as [
        URL,
        RequestInit,
      ];
      expect(url.pathname).toBe('/platform/main/api/agents/dist/manifest');
      expect(options.headers).not.toHaveProperty('authorization');
      expect(options.headers).not.toHaveProperty('x-api-key');
    },
  );

  it('preserves authenticated updates when no public target is supplied', async () => {
    await publicCommand().run(['--check'], config);
    expect(mocks.session).toHaveBeenCalledOnce();
    const client = mocks.latest.mock.calls[0]![0];
    const request = vi.fn(async () => new Response('{}'));
    vi.stubGlobal('fetch', request);
    await client.request('GET', '/api/agents/dist/manifest');
    expect(request).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer test-session',
        }),
      }),
    );
  });

  it.each([
    'not a URL',
    'ftp://public.test',
    'https://user:secret@public.test',
    'https://public.test?token=secret',
    'https://public.test/#secret',
  ])(
    'refuses unsafe public targets without echoing secrets: %s',
    async (server) => {
      await expect(
        publicCommand().run(['--server', server], config),
      ).rejects.toThrow('HTTP(S) application URL');
      expect(mocks.latest).not.toHaveBeenCalled();
    },
  );

  it('retains Runner ownership and session-agent restrictions for public targets', async () => {
    mocks.findRun.mockReturnValue('/run/credential.json');
    await expect(
      publicCommand().run(['--server', 'https://public.test'], config),
    ).rejects.toThrow('runner keeps it up to date');
    expect(mocks.session).not.toHaveBeenCalled();
    mocks.findRun.mockReturnValue(undefined);
    vi.stubEnv('ACME_AGENT_SESSION', 'test-session');
    const Command = updateCommand({
      ...TEST_CLI,
      envPrefix: 'ACME',
      selfUpdate: { packageRoot: home, public: true },
    });
    await expect(
      Command.run(['--server', 'https://public.test'], config),
    ).rejects.toThrow('runner keeps it up to date');
    expect(mocks.latest).not.toHaveBeenCalled();
  });

  it('restarts after activation and announces the activated version', async () => {
    const Command = command();
    const log = vi.spyOn(Command.prototype, 'log').mockImplementation(() => {});
    const result = await Command.run([], config);
    expect(result).toMatchObject({ updated: true, latest: '1.1.0' });
    expect(mocks.restart).toHaveBeenCalledWith('acme');
    expect(mocks.apply.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.restart.mock.invocationCallOrder[0]!,
    );
    expect(log).toHaveBeenCalledWith('Restarted acme-acp.service on 1.1.0.');
  });

  it('keeps update JSON data unchanged and includes restart failure in envelope warnings', async () => {
    mocks.restart.mockResolvedValue({
      restarted: [],
      warnings: ['Run acme acp service restart to retry.'],
    });
    const Command = command();
    const output = vi
      .spyOn(
        Command.prototype as unknown as { logJson(value: unknown): void },
        'logJson',
      )
      .mockImplementation(() => {});
    vi.spyOn(Command.prototype, 'warn').mockImplementation(
      (message) => message,
    );
    const result = await Command.run(['--json'], config);
    expect(result).toEqual({
      current: '1.0.0',
      latest: '1.1.0',
      updated: true,
      previous: '1.0.0',
    });
    const envelope = output.mock.calls[0]![0] as {
      ok: boolean;
      result: unknown;
      warnings: string[];
    };
    expect(envelope.ok).toBe(true);
    expect(envelope.result).toEqual(result);
    expect(envelope.warnings).toEqual([
      'Run acme acp service restart to retry.',
    ]);
  });

  it('exposes the same restart helper through the manual service command', async () => {
    const Restart = acpCommands(TEST_CLI)['acp:service:restart']!;
    const log = vi.spyOn(Restart.prototype, 'log').mockImplementation(() => {});
    expect(await Restart.run([], config)).toEqual({
      restarted: ['acme-acp.service'],
    });
    expect(mocks.restart).toHaveBeenCalledWith('acme');
    expect(log).toHaveBeenCalledWith('Restarted acme-acp.service.');
  });

  it('does not restart on --check, when already current or after a failed update', async () => {
    await command().run(['--check'], config);
    mocks.latest.mockResolvedValue({ product: 'acme', version: '1.0.0' });
    await command().run([], config);
    mocks.latest.mockResolvedValue({
      product: 'acme',
      version: '1.1.0',
      url: '/cli.tar.gz',
    });
    mocks.apply.mockRejectedValue(new Error('download failed'));
    await expect(command().run([], config)).rejects.toThrow('download failed');
    expect(mocks.restart).not.toHaveBeenCalled();
  });
});
