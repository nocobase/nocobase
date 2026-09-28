import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import packageMetadata from '../package.json' with { type: 'json' };
// @ts-expect-error -- plain JavaScript that runs before the version check, with no declarations of its own
import {
  unsupportedNodeVersionEnvelope,
  unsupportedNodeVersionOutput,
} from '@nocobase/cli-envelope/node-guard';
import { pendingTaskCount, toSuggestion } from '../src/lib/app-cli.ts';
import { formatCommandLine, quoteForShell } from '@nocobase/cli-envelope';
import {
  installerCommand,
  installerCommandLine,
} from '../src/lib/invocation.ts';
import { waitForHealthy } from '../src/lib/health.ts';
import { createPm2, parseJlist, type Pm2 } from '../src/lib/pm2.ts';
import { checkPm2, checkPnpm } from '../src/lib/prechecks.ts';
import { InstallerError } from '../src/lib/errors.ts';
import { resolveTemplateVersion, type FetchLike } from '../src/lib/registry.ts';
import {
  driverSpecifier,
  driversFor,
  installEnv,
  parseCreateResult,
  verifyBuildTarget,
} from '../src/lib/release.ts';

function jsonFetch(body: unknown, status = 200): FetchLike {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

describe('resolveTemplateVersion', () => {
  const packument = {
    'dist-tags': { latest: '1.0.0-beta.37', beta: '1.0.0-beta.37' },
    versions: { '1.0.0-beta.36': {}, '1.0.0-beta.37': {} },
  };

  it('turns a dist-tag into the exact version', async () => {
    await expect(
      resolveTemplateVersion(
        'https://registry.test/',
        '@nocobase/app-template-hub',
        'latest',
        jsonFetch(packument),
      ),
    ).resolves.toBe('1.0.0-beta.37');
  });

  it('accepts an exact version the registry has', async () => {
    await expect(
      resolveTemplateVersion(
        'https://registry.test',
        '@nocobase/app-template-hub',
        '1.0.0-beta.36',
        jsonFetch(packument),
      ),
    ).resolves.toBe('1.0.0-beta.36');
  });

  it('names the tags and recent versions when the request matches nothing', async () => {
    await expect(
      resolveTemplateVersion(
        'https://registry.test',
        '@nocobase/app-template-hub',
        '9.9.9',
        jsonFetch(packument),
      ),
    ).rejects.toMatchObject({ code: 'VERSION_NOT_FOUND', exitCode: 2 });
  });

  it('reports an unreachable registry as a precheck failure', async () => {
    await expect(
      resolveTemplateVersion(
        'https://registry.test',
        '@nocobase/app-template-hub',
        'latest',
        jsonFetch({}, 503),
      ),
    ).rejects.toMatchObject({ code: 'REGISTRY_UNREACHABLE', exitCode: 2 });
  });

  it('asks for the scoped package with an encoded slash', async () => {
    let requested = '';
    const fetchImpl: FetchLike = async (url) => {
      requested = url;
      return { ok: true, status: 200, json: async () => packument };
    };
    await resolveTemplateVersion(
      'https://registry.test/',
      '@nocobase/app-template-hub',
      'latest',
      fetchImpl,
    );
    expect(requested).toBe(
      'https://registry.test/@nocobase%2fapp-template-hub',
    );
  });
});

describe('create-app result', () => {
  it('reads the last JSON line among pnpm notices', () => {
    const stdout = [
      'Progress: resolved 1, reused 0, downloaded 1, added 1, done',
      JSON.stringify({
        schemaVersion: 1,
        ok: true,
        command: 'create-app',
        status: 'success',
        result: { nextCommands: [] },
        warnings: [],
      }),
      '',
    ].join('\n');
    expect(parseCreateResult(stdout)).toMatchObject({ ok: true });
    expect(parseCreateResult('no json here')).toEqual({ ok: false });
  });

  it('reads the stage and message a failure reports', () => {
    expect(
      parseCreateResult(
        JSON.stringify({
          schemaVersion: 1,
          ok: false,
          command: 'create-app',
          status: 'failure',
          error: {
            code: 'INSTALL_FAILED',
            message: 'installation failed',
            suggestions: [],
            details: { stage: 'install', projectCreated: true },
          },
          warnings: [],
        }),
      ),
    ).toEqual({ ok: false, stage: 'install', message: 'installation failed' });
  });

  it('reads the flat result a create-app from before the envelope prints', () => {
    expect(
      parseCreateResult(
        '{"status":"success","stage":"complete","nextCommands":[]}',
      ),
    ).toMatchObject({ ok: true });
    expect(
      parseCreateResult(
        '{"status":"error","stage":"install","message":"installation failed"}',
      ),
    ).toEqual({ ok: false, stage: 'install', message: 'installation failed' });
  });
});

describe('drivers', () => {
  it('adds nothing for SQLite and the dialect package otherwise', () => {
    expect(driversFor('sqlite')).toEqual([]);
    expect(driversFor('postgres')).toEqual(['@nocobase/db-postgres']);
  });

  it('pins a driver to the range the installed runtime accepts', async () => {
    const project = await mkdtemp(
      path.join(os.tmpdir(), 'app-installer-driver-'),
    );
    try {
      const server = path.join(project, 'node_modules/@nocobase/app-server');
      await mkdir(server, { recursive: true });
      await writeFile(
        path.join(server, 'package.json'),
        JSON.stringify({
          peerDependencies: { '@nocobase/db-postgres': '^0.1.0-beta.3' },
        }),
      );
      await expect(
        driverSpecifier(project, '@nocobase/db-postgres'),
      ).resolves.toBe('@nocobase/db-postgres@^0.1.0-beta.3');
      await expect(
        driverSpecifier(project, '@nocobase/db-mysql'),
      ).resolves.toBe('@nocobase/db-mysql');
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });

  it('clears the release-age hold for install steps', () => {
    expect(installEnv({ PATH: '/bin' })).toEqual({
      PATH: '/bin',
      PNPM_CONFIG_MINIMUM_RELEASE_AGE: '0',
    });
  });
});

describe('verifyBuildTarget', () => {
  const here = { platform: 'linux', arch: 'x64', nodeMajor: 24 };

  it('accepts a build for this machine', () => {
    expect(verifyBuildTarget({ ...here, libc: 'glibc' }, here)).toMatchObject(
      here,
    );
  });

  it('rejects another platform or Node major', () => {
    expect(() => verifyBuildTarget({ ...here, nodeMajor: 22 }, here)).toThrow(
      /Node 22/,
    );
    expect(() => verifyBuildTarget({ ...here, arch: 'arm64' }, here)).toThrow(
      /arm64/,
    );
    expect(() => verifyBuildTarget(undefined, here)).toThrow(
      /unknown platform/,
    );
  });
});

describe('pm2 jlist', () => {
  it('skips daemon notices, including ones that start with a bracket', () => {
    const stdout = [
      '[PM2] Spawning PM2 daemon with pm2_home=/home/hub/.pm2',
      '[PM2] PM2 Successfully daemonized',
      JSON.stringify([
        {
          name: 'nocobase-hub',
          pid: 42,
          pm2_env: { status: 'online', restart_time: 3 },
        },
      ]),
    ].join('\n');
    expect(parseJlist(stdout)).toEqual([
      { name: 'nocobase-hub', pid: 42, status: 'online', restarts: 3 },
    ]);
    expect(parseJlist('')).toEqual([]);
  });
});

describe('db apply --dry-run', () => {
  it('counts pending tasks from the plan, not from the status', () => {
    expect(
      pendingTaskCount({
        ok: true,
        status: 'success-noop',
        result: {
          plan: [
            { connection: 'main', kind: 'migrations', tasks: [{}, {}] },
            { connection: 'main', kind: 'seeds', tasks: [{}] },
          ],
        },
      }),
    ).toBe(3);
    expect(pendingTaskCount({ ok: true, result: { plan: [] } })).toBe(0);
  });
});

describe('waitForHealthy', () => {
  it('keeps polling until the Hub answers ok', async () => {
    const answers = [false, false, true];
    const fetchImpl: FetchLike = async () => {
      const ok = answers.shift() ?? true;
      return { ok: true, status: 200, json: async () => ({ ok }) };
    };
    let clock = 0;
    await expect(
      waitForHealthy('http://127.0.0.1/hub/api/healthz', {
        timeoutMs: 10_000,
        fetchImpl,
        now: () => clock,
        sleep: async (ms) => {
          clock += ms;
        },
      }),
    ).resolves.toBe(true);
  });

  it('gives up at the timeout', async () => {
    const fetchImpl: FetchLike = async () => {
      throw new Error('ECONNREFUSED');
    };
    let clock = 0;
    await expect(
      waitForHealthy('http://127.0.0.1/hub/api/healthz', {
        timeoutMs: 3_000,
        fetchImpl,
        now: () => clock,
        sleep: async (ms) => {
          clock += ms;
        },
      }),
    ).resolves.toBe(false);
  });
});

describe('suggested commands', () => {
  it('runs app-installer through npx with the registry named', () => {
    expect(
      installerCommand('rollback --dir /srv/hub', {
        registry: 'http://127.0.0.1:4873/',
      }),
    ).toBe(
      `npx --yes --registry=http://127.0.0.1:4873 @nocobase/app-installer@${packageMetadata.version} rollback --dir /srv/hub`,
    );
    expect(
      installerCommand('status', {
        registry: 'https://npm.nocobase.ai',
        version: 'latest',
      }),
    ).toBe(
      'npx --yes --registry=https://npm.nocobase.ai @nocobase/app-installer@latest status',
    );
  });

  it("names app-installer in a suggestion's run as an executable and its arguments", () => {
    expect(
      installerCommandLine(['rollback', '--dir', '/srv/my hub'], {
        registry: 'http://127.0.0.1:4873/',
      }),
    ).toEqual({
      command: 'npx',
      args: [
        '--yes',
        '--registry=http://127.0.0.1:4873',
        `@nocobase/app-installer@${packageMetadata.version}`,
        'rollback',
        '--dir',
        '/srv/my hub',
      ],
    });
  });

  it('writes a command out for a person with only the arguments that need it quoted', () => {
    expect(
      formatCommandLine({
        command: 'tail',
        args: ['-n', '100', "/srv/it's here/logs/error.log"],
      }),
    ).toBe("tail -n 100 '/srv/it'\\''s here/logs/error.log'");
  });

  it('quotes a path only when a shell would split or expand it', () => {
    expect(quoteForShell('/srv/nocobase/hub')).toBe('/srv/nocobase/hub');
    expect(quoteForShell('/srv/my hub')).toBe("'/srv/my hub'");
    expect(quoteForShell("/srv/it's")).toBe("'/srv/it'\\''s'");
    expect(quoteForShell('/srv/$HOME')).toBe("'/srv/$HOME'");
  });

  it("folds the release CLI's commands into the message, since none of them runs as-is from a Hub root", () => {
    expect(
      toSuggestion({
        message: 'See the flags:',
        run: {
          command: 'node',
          args: [
            '/srv/hub/releases/1.1.0/hub/dist/cli/index.js',
            'config',
            'set',
            '--help',
          ],
        },
      }),
    ).toEqual({
      message:
        "See the flags: (the application CLI's command: node /srv/hub/releases/1.1.0/hub/dist/cli/index.js config set --help)",
    });
    expect(
      toSuggestion({ message: 'Install the driver:', run: 'pnpm add pg' }),
    ).toEqual({
      message:
        "Install the driver: (the application CLI's command: pnpm add pg)",
    });
    expect(toSuggestion({ message: 'Check the host.' })).toEqual({
      message: 'Check the host.',
    });
    expect(toSuggestion({ run: 'pnpm add pg' })).toEqual({
      message: "(the application CLI's command: pnpm add pg)",
    });
  });
});

describe('unsupported Node.js', () => {
  it('prints the envelope on stdout under --json, and text on stderr otherwise', () => {
    const guard = { name: 'app-installer', version: 'v22.1.0' };
    const json = unsupportedNodeVersionOutput({
      ...guard,
      argv: ['upgrade', '--dir', '/srv/hub', '--json'],
    });
    expect(json.stream).toBe('stdout');
    expect(JSON.parse(json.text)).toMatchObject({
      command: 'upgrade',
      error: { code: 'NODE_UNSUPPORTED' },
    });
    // A flag's value is never taken for the command: with a flag first, the document names no command.
    expect(
      JSON.parse(
        unsupportedNodeVersionOutput({
          ...guard,
          argv: ['--dir', '/srv/hub', 'status', '--json'],
        }).text,
      ),
    ).toMatchObject({ command: '' });
    const text = unsupportedNodeVersionOutput({ ...guard, argv: ['upgrade'] });
    expect(text.stream).toBe('stderr');
    expect(text.text).toContain('Node.js 24 or later is required');
  });

  it('answers --json with the same envelope as any other failure', () => {
    expect(unsupportedNodeVersionEnvelope('install', 'v20.11.0')).toMatchObject(
      {
        schemaVersion: 1,
        ok: false,
        command: 'install',
        status: 'failure',
        error: {
          code: 'NODE_UNSUPPORTED',
          message: expect.stringContaining('v20.11.0') as unknown,
        },
      },
    );
  });
});

describe('pnpm version', () => {
  it('names corepack enable and corepack prepare as two commands, since a suggestion runs one', async () => {
    const corepack = [
      { run: { command: 'corepack', args: ['enable'] } },
      {
        run: {
          command: 'corepack',
          args: ['prepare', 'pnpm@11', '--activate'],
        },
      },
    ];
    await expect(
      checkPnpm(() => Promise.reject(new Error('ENOENT'))),
    ).rejects.toMatchObject({ code: 'PNPM_MISSING', suggestions: corepack });
    await expect(
      checkPnpm(async () => ({ stdout: '10.4.1\n', stderr: '' })),
    ).rejects.toMatchObject({
      code: 'PNPM_UNSUPPORTED',
      suggestions: corepack,
    });
  });
});

describe('pm2 version', () => {
  const pm2Printing = (stdout: string): Pm2 =>
    createPm2('pm2', async () => ({ stdout, stderr: '' }));

  it('takes the line that is a version when pm2 prints notices around it', async () => {
    await expect(
      pm2Printing(
        '[PM2] Spawning PM2 daemon with pm2_home=/tmp/x\n5.4.2\n[PM2] In-memory PM2 is out-of-date\n',
      ).version(),
    ).resolves.toBe('5.4.2');
  });

  it('refuses a pm2 older than 4.3 and says so', async () => {
    await expect(checkPm2(pm2Printing('4.2.3\n'))).rejects.toMatchObject({
      code: 'PM2_UNSUPPORTED',
      message: expect.stringContaining('found 4.2.3') as unknown,
      // One command per suggestion: the update, then the daemon swap.
      suggestions: [
        { run: { command: 'npm', args: ['install', '-g', 'pm2@latest'] } },
        { run: { command: 'pm2', args: ['update'] } },
      ],
    });
    await expect(checkPm2(pm2Printing('4.3.0\n'))).resolves.toBe('4.3.0');
  });

  it('says a version it cannot read is unreadable, not that pm2 is too old', async () => {
    const error: unknown = await checkPm2(pm2Printing('unknown\n')).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(InstallerError);
    expect((error as InstallerError).code).toBe('PM2_UNSUPPORTED');
    expect((error as InstallerError).message).toContain(
      'printed "unknown", which is not a version',
    );
  });
});
