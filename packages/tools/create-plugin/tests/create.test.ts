import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { runCreatePluginCli } from '../src/create.ts';

const created: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    created
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe('runCreatePluginCli', () => {
  it('prints a stable, read-only JSON generation plan', async () => {
    const repoRoot = await mkdtemp(
      path.join(os.tmpdir(), 'create-plugin-cli-'),
    );
    created.push(repoRoot);
    await mkdir(path.join(repoRoot, 'packages', 'plugins'), {
      recursive: true,
    });
    const output: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk): boolean => {
      output.push(String(chunk));
      return true;
    });

    await expect(
      runCreatePluginCli({
        argv: [
          'audit-log',
          '--with',
          'server.routes',
          '--with',
          'server.locales',
          '--with',
          'client.locales',
          '--with',
          'skills',
          '--dry-run',
          '--json',
        ],
        binary: 'pnpm plugin:create',
        repoRoot,
        version: '0.0.1',
      }),
    ).resolves.toBe(0);

    const envelope = JSON.parse(output.join('')) as {
      schemaVersion: number;
      ok: boolean;
      command: string;
      status: string;
      result: unknown;
    };
    expect(envelope).toMatchObject({
      schemaVersion: 1,
      ok: true,
      command: 'create-plugin',
      // A dry run writes nothing, which the application CLI reports as success-noop.
      status: 'success-noop',
    });
    const result = envelope.result as {
      mode: string;
      requestedCapabilities: string[];
      capabilities: {
        client: { locales: boolean };
        server: { locales: boolean; routes: boolean };
        skills: boolean;
      };
      derivedStructure: { clientPlugin: boolean; serverPlugin: boolean };
      files: Array<{ path: string; reason: string }>;
      writes: string[];
      commands: string[];
    };
    expect(result).toMatchObject({
      mode: 'dry-run',
      requestedCapabilities: [
        'server.routes',
        'server.locales',
        'client.locales',
        'skills',
      ],
      capabilities: {
        client: { locales: true },
        server: { locales: true, routes: true },
        skills: true,
      },
      derivedStructure: { clientPlugin: true, serverPlugin: true },
      writes: [],
      commands: [],
    });
    expect(result.files).toContainEqual({
      path: 'server/routes/index.ts',
      reason: 'server.routes',
    });
    expect(result.files).toContainEqual({
      path: 'skills/nocobase-app-plugin-audit-log/SKILL.md',
      reason: 'skills',
    });
    expect(result.files).toContainEqual({
      path: 'client/locales/index.ts',
      reason: 'client.locales',
    });
    expect(result.files).toContainEqual({
      path: 'server/locales/index.ts',
      reason: 'server.locales',
    });
    await expect(
      readFile(
        path.join(
          repoRoot,
          'packages/plugins/app-plugin-audit-log/package.json',
        ),
        'utf8',
      ),
    ).rejects.toMatchObject({ code: 'ENOENT' });

    const createRepoRoot = await mkdtemp(
      path.join(os.tmpdir(), 'create-plugin-cli-'),
    );
    created.push(createRepoRoot);
    await mkdir(path.join(createRepoRoot, 'packages', 'plugins'), {
      recursive: true,
    });
    output.length = 0;

    await expect(
      runCreatePluginCli({
        argv: [
          'audit-log',
          '--with',
          'server.routes',
          '--with',
          'server.locales',
          '--with',
          'client.locales',
          '--with',
          'skills',
          '--no-install',
          '--json',
        ],
        binary: 'pnpm plugin:create',
        repoRoot: createRepoRoot,
        version: '0.0.1',
      }),
    ).resolves.toBe(0);

    const createEnvelope = JSON.parse(output.join('')) as {
      ok: boolean;
      status: string;
      result: unknown;
    };
    expect(createEnvelope).toMatchObject({ ok: true, status: 'success' });
    expect(createEnvelope.result).toMatchObject({
      mode: 'create',
      requestedCapabilities: result.requestedCapabilities,
      capabilities: result.capabilities,
      derivedStructure: result.derivedStructure,
      files: result.files,
      writes: result.files.map((file) => file.path),
      commands: [],
    });
  });

  it.each([
    [['audit-log', '--dry-run', '--json'], 'NO_CAPABILITIES_SELECTED'],
    [
      ['audit-log', '--with', 'server.service', '--dry-run', '--json'],
      'UNKNOWN_CAPABILITY',
    ],
  ] as const)(
    'prints one JSON error document on stdout for %s',
    async (argv, expectedCode) => {
      const stdout: string[] = [];
      const stderr: string[] = [];
      vi.spyOn(process.stdout, 'write').mockImplementation((chunk): boolean => {
        stdout.push(String(chunk));
        return true;
      });
      vi.spyOn(process.stderr, 'write').mockImplementation((chunk): boolean => {
        stderr.push(String(chunk));
        return true;
      });

      await expect(
        runCreatePluginCli({
          argv,
          binary: 'pnpm plugin:create',
          version: '0.0.1',
        }),
      ).resolves.toBe(1);

      // stdout is where a caller reading --json looks, whichever way the run ended.
      expect(stderr).toEqual([]);
      expect(stdout).toHaveLength(1);
      expect(JSON.parse(stdout.join(''))).toMatchObject({
        schemaVersion: 1,
        ok: false,
        command: 'create-plugin',
        status: 'failure',
        error: {
          code: expectedCode,
          message: expect.any(String),
          suggestions: expect.arrayContaining([
            { message: expect.any(String) },
          ]),
        },
        warnings: [],
      });
    },
  );

  it('answers --version and --help with the envelope under --json', async () => {
    const output: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk): boolean => {
      output.push(String(chunk));
      return true;
    });

    await expect(
      runCreatePluginCli({
        argv: ['--version', '--json'],
        binary: 'pnpm plugin:create',
        version: '0.0.1',
      }),
    ).resolves.toBe(0);
    expect(JSON.parse(output.join(''))).toStrictEqual({
      schemaVersion: 1,
      ok: true,
      command: 'create-plugin',
      status: 'success',
      result: { version: '0.0.1' },
      warnings: [],
    });

    output.length = 0;
    await expect(
      runCreatePluginCli({
        argv: ['--help', '--json'],
        binary: 'pnpm plugin:create',
        version: '0.0.1',
      }),
    ).resolves.toBe(0);
    expect(JSON.parse(output.join(''))).toMatchObject({
      ok: true,
      result: { help: expect.stringContaining('--with') },
    });
  });
});
