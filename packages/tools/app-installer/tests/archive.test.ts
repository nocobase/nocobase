import {
  existsSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createWorld,
  freePort,
  hub,
  makeArchive,
  tempDir,
  type ArchiveOptions,
  type FakeWorld,
} from './harness.ts';

let temp: ReturnType<typeof tempDir>;
let root: string;
let world: FakeWorld;
let builds = 0;

/** An archive of the `crm` application, mounted at /crm, built a minute after the previous one. */
function archive(options: Partial<ArchiveOptions> & { version: string }) {
  builds += 1;
  return makeArchive(path.join(temp.dir, 'archives', `${builds}.tar.gz`), {
    name: 'crm',
    basePath: '/crm',
    builtAt: new Date(Date.UTC(2026, 5, 1) + builds * 60_000).toISOString(),
    ...options,
  });
}

const state = () =>
  JSON.parse(readFileSync(path.join(root, 'installer.json'), 'utf8')) as {
    current: string;
    appName: string;
    basePath: string;
    source: { kind: string };
    releases: { id: string; version: string }[];
  };
const linked = () =>
  readlinkSync(path.join(root, 'current')).split(path.sep)[1];

async function install(file: string, extra: string[] = []) {
  return hub(world, [
    'install',
    root,
    '--archive',
    file,
    '--port',
    String(await freePort()),
    '--origin',
    'https://apps.example.com',
    ...extra,
  ]);
}

beforeEach(() => {
  temp = tempDir('app-installer-archive-');
  root = path.join(temp.dir, 'crm');
  world = createWorld();
});

afterEach(() => {
  temp.remove();
});

describe('install --archive', () => {
  it('installs the application the archive holds, at the base path it was built for', async () => {
    const result = await install(archive({ version: '0.1.0' }));

    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({
      appName: 'crm',
      version: '0.1.0',
      basePath: '/crm',
      name: 'nocobase-crm',
      url: 'https://apps.example.com/crm/',
    });
    expect(state()).toMatchObject({
      appName: 'crm',
      basePath: '/crm',
      templateKind: 'app',
      source: { kind: 'archive' },
    });
    expect(linked()).toBe(result.json.result?.releaseId);
    const env = readFileSync(path.join(root, 'app.env'), 'utf8');
    expect(env).toContain('APP_BASE_PATH=/crm');
    expect(env).not.toContain('HUB_STORAGE_DIR');
    // Nothing is built here, so pnpm is neither needed nor asked for.
    expect(world.calls.some((call) => call[0] === 'pnpm')).toBe(false);
    expect(
      readFileSync(path.join(root, 'ecosystem.config.cjs'), 'utf8'),
    ).not.toContain('treekill');
  });

  it('refuses an archive from a build that does not record its base path and build time', async () => {
    const result = await install(archive({ version: '0.1.0', legacy: true }));

    expect(result.code).toBe(2);
    expect(result.json.error?.code).toBe('ARCHIVE_TOO_OLD');
    expect(JSON.stringify(result.json.error)).toContain('pnpm build --target');
    expect(existsSync(root)).toBe(false);
  });

  it('refuses an archive built for another machine, naming the build that fits this one', async () => {
    const result = await install(
      archive({
        version: '0.1.0',
        buildTarget: { platform: 'linux', arch: 'mips', nodeMajor: 18 },
      }),
    );

    expect(result.code).toBe(2);
    expect(result.json.error?.code).toBe('BUILD_TARGET_MISMATCH');
    const [suggestion] = (
      result.json.error as unknown as { suggestions: { run: string }[] }
    ).suggestions;
    expect(suggestion.run).toBe(
      `pnpm build --target ${process.platform}-${process.arch} --node-version ${Number.parseInt(process.versions.node, 10)} --tar`,
    );
    expect(existsSync(root)).toBe(false);
  });

  it('needs the dialect driver inside the archive, since nothing can add it afterwards', async () => {
    const missing = await install(archive({ version: '0.1.0' }), [
      '--dialect',
      'postgres',
    ]);
    expect(missing.code).toBe(2);
    expect(missing.json.error?.code).toBe('DRIVER_MISSING');
    expect(existsSync(root)).toBe(false);

    const carried = await install(
      archive({ version: '0.1.0', drivers: ['@nocobase/db-postgres'] }),
      ['--dialect', 'postgres'],
    );
    expect(carried.code).toBe(0);
  });

  it('refuses a release that keeps its data inside the release directory', async () => {
    world.ignoresStorageDir = true;
    const result = await install(archive({ version: '0.1.0' }));

    expect(result.code).toBe(1);
    expect(result.json.error?.code).toBe('STORAGE_IN_RELEASE');
    expect(existsSync(root)).toBe(false);
  });

  it('treats a Hub project deployed from an archive as a Hub', async () => {
    const result = await install(
      archive({ name: 'my-hub', version: '0.1.0', templateKind: 'hub' }),
    );

    expect(result.code).toBe(0);
    expect(state()).toMatchObject({ templateKind: 'hub' });
    // The Hub stops its App Host child itself, so pm2 must not kill the tree.
    expect(
      readFileSync(path.join(root, 'ecosystem.config.cjs'), 'utf8'),
    ).toContain('treekill: false');
    const asked = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--archive',
      archive({ name: 'my-hub', version: '0.2.0', templateKind: 'hub' }),
    ]);
    expect(asked.json.error?.code).toBe('CONFIRMATION_REQUIRED');
    expect(JSON.stringify(asked.json.error?.details)).toContain(
      'every application it hosts',
    );
  });
});

describe('upgrade --archive', () => {
  it('deploys a new build of the same version as a release of its own', async () => {
    const first = await install(archive({ version: '0.1.0' }));
    const result = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--archive',
      archive({ version: '0.1.0' }),
      '--yes',
    ]);

    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({
      from: first.json.result?.releaseId,
      fromVersion: '0.1.0',
      toVersion: '0.1.0',
      rebuilt: false,
      reused: false,
    });
    expect(result.json.result?.to).not.toBe(first.json.result?.releaseId);
    expect(linked()).toBe(result.json.result?.to);
    expect(readdirSync(path.join(root, 'releases'))).toHaveLength(2);
  });

  it('changes nothing for the archive already running', async () => {
    const file = archive({ version: '0.1.0' });
    await install(file);
    const result = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--archive',
      file,
      '--yes',
    ]);

    expect(result.code).toBe(0);
    expect(result.json.status).toBe('success-noop');
    expect(readdirSync(path.join(root, 'releases'))).toHaveLength(1);
  });

  it('reuses an archive already on disk after a rollback', async () => {
    await install(archive({ version: '0.1.0' }));
    const next = archive({ version: '0.2.0' });
    await hub(world, ['upgrade', '--dir', root, '--archive', next, '--yes']);
    await hub(world, ['rollback', '--dir', root, '--yes']);
    const result = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--archive',
      next,
      '--yes',
    ]);

    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({
      toVersion: '0.2.0',
      reused: true,
    });
  });

  it.each([
    ['another application', { name: 'erp', version: '0.2.0' }, 'APP_MISMATCH'],
    [
      'another base path',
      { version: '0.2.0', basePath: '/other' },
      'BASE_PATH_MISMATCH',
    ],
    ['an older version', { version: '0.0.9' }, 'DOWNGRADE'],
  ] as const)(
    'refuses %s and leaves nothing of it behind',
    async (_, options, code) => {
      await install(archive({ version: '0.1.0' }));
      const before = readdirSync(path.join(root, 'releases'));
      const result = await hub(world, [
        'upgrade',
        '--dir',
        root,
        '--archive',
        archive(options),
        '--yes',
      ]);

      expect(result.code).toBe(2);
      expect(result.json.error?.code).toBe(code);
      expect(readdirSync(path.join(root, 'releases'))).toEqual(before);
      expect(world.pm2.calls.some((call) => call.startsWith('stop'))).toBe(
        false,
      );
    },
  );

  it('takes the kind of source the install did', async () => {
    await install(archive({ version: '0.1.0' }));
    const withoutArchive = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--yes',
    ]);
    expect(withoutArchive.code).toBe(2);
    expect(withoutArchive.json.error?.message).toContain('--archive');

    const withTo = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--archive',
      archive({ version: '0.2.0' }),
      '--to',
      '0.2.0',
      '--yes',
    ]);
    expect(withTo.code).toBe(2);
    expect(withTo.json.error?.message).toContain('--to');

    const hubRoot = path.join(temp.dir, 'hub');
    await hub(world, [
      'install',
      hubRoot,
      '--template',
      'hub',
      '--port',
      String(await freePort()),
    ]);
    const onTemplate = await hub(world, [
      'upgrade',
      '--dir',
      hubRoot,
      '--archive',
      archive({ version: '9.0.0', name: 'hub', basePath: '/hub' }),
      '--yes',
    ]);
    expect(onTemplate.code).toBe(2);
    expect(onTemplate.json.error?.code).toBe('INVALID_USAGE');
  });

  it('reports an archive installation without asking a registry, and advises a rebuilt archive for another Node', async () => {
    await install(archive({ version: '0.1.0' }));
    const status = await hub(world, ['status', '--dir', root]);
    expect(status.json.result).toMatchObject({
      appName: 'crm',
      version: '0.1.0',
      source: { kind: 'archive' },
      latest: null,
      updateAvailable: null,
    });

    await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--archive',
      archive({ version: '0.2.0' }),
      '--yes',
    ]);
    const next = JSON.parse(
      readFileSync(path.join(root, 'installer.json'), 'utf8'),
    ) as {
      releases: { version: string; buildTarget: { nodeMajor: number } }[];
    };
    for (const record of next.releases) {
      record.buildTarget.nodeMajor -= 1;
    }
    writeFileSync(path.join(root, 'installer.json'), JSON.stringify(next));

    const warned = await hub(world, ['status', '--dir', root]);
    expect(warned.json.warnings.join('\n')).toContain('pnpm build --target');
    expect(warned.json.warnings.join('\n')).not.toContain('--rebuild');
    const refused = await hub(world, ['rollback', '--dir', root, '--yes']);
    expect(refused.json.error?.code).toBe('NODE_MISMATCH');
    const advice = (
      refused.json.error as unknown as {
        suggestions: { message: string; run?: string }[];
      }
    ).suggestions;
    expect(advice[0].run).toMatch(/^APP_BASE_PATH=\/crm pnpm build --target /u);
    // The archive's path is not known, so the second step is prose rather than a command that would not run.
    expect(advice[1].run).toBeUndefined();
    expect(advice[1].message).toContain('--archive');
  });

  it('rolls back, on an archive that keeps its data inside the release, and reports why', async () => {
    await install(archive({ version: '0.1.0' }));
    const before = state().current;
    world.ignoresStorageDir = true;
    const result = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--archive',
      archive({ version: '0.2.0' }),
      '--yes',
    ]);

    expect(result.code).toBe(3);
    expect(result.json.error?.code).toBe('UPGRADE_ROLLED_BACK');
    expect(result.json.error?.message).toContain('predates APP_STORAGE_DIR');
    expect(linked()).toBe(before);
    expect(state().current).toBe(before);
  });

  it('adopts a release directory on disk that installer.json does not record', async () => {
    await install(archive({ version: '0.1.0' }));
    const next = archive({ version: '0.2.0' });
    const upgraded = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--archive',
      next,
      '--yes',
    ]);
    await hub(world, ['rollback', '--dir', root, '--yes']);
    // As left by a run interrupted after unpacking and before recording: the directory without its record.
    const orphan = String(upgraded.json.result?.to);
    const current = JSON.parse(
      readFileSync(path.join(root, 'installer.json'), 'utf8'),
    ) as { releases: { id: string }[]; history: { to: string }[] };
    current.releases = current.releases.filter(
      (record) => record.id !== orphan,
    );
    current.history = current.history.filter((entry) => entry.to !== orphan);
    writeFileSync(path.join(root, 'installer.json'), JSON.stringify(current));

    const result = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--archive',
      next,
      '--yes',
    ]);
    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({ to: orphan, reused: false });
    expect(state().releases.map((record) => record.id)).toContain(orphan);
  });

  it('rolls back to the earlier build of a version deployed twice', async () => {
    const first = await install(archive({ version: '0.1.0' }));
    await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--archive',
      archive({ version: '0.1.0' }),
      '--yes',
    ]);
    const result = await hub(world, [
      'rollback',
      '--dir',
      root,
      '--to',
      '0.1.0',
      '--yes',
    ]);

    expect(result.code).toBe(0);
    expect(result.json.status).toBe('success');
    expect(result.json.result?.to).toBe(first.json.result?.releaseId);
  });

  it('never suggests a command with a placeholder, and builds for the installed base path', async () => {
    await install(archive({ version: '0.1.0' }));
    const withoutArchive = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--yes',
    ]);
    const suggestions = (
      withoutArchive.json.error as unknown as {
        suggestions: { message: string; run?: string }[];
      }
    ).suggestions;
    expect(
      suggestions.every((suggestion) => suggestion.run === undefined),
    ).toBe(true);
    expect(suggestions[0].message).toContain('--archive');

    const missing = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--archive',
      archive({ version: '0.2.0' }),
      '--yes',
    ]);
    expect(missing.code).toBe(0);
    const driver = await hub(world, [
      'install',
      path.join(temp.dir, 'erp'),
      '--archive',
      archive({ name: 'erp', version: '0.1.0', basePath: '/erp' }),
      '--port',
      String(await freePort()),
      '--dialect',
      'postgres',
    ]);
    expect(driver.json.error?.code).toBe('DRIVER_MISSING');
    const runs = (
      driver.json.error as unknown as { suggestions: { run?: string }[] }
    ).suggestions.map((suggestion) => suggestion.run);
    expect(runs[1]).toMatch(/^APP_BASE_PATH=\/erp pnpm build --target /u);
  });

  it('rolls back to the archive it came from', async () => {
    const first = await install(archive({ version: '0.1.0' }));
    await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--archive',
      archive({ version: '0.2.0' }),
      '--yes',
    ]);
    const result = await hub(world, ['rollback', '--dir', root, '--yes']);

    expect(result.code).toBe(0);
    expect(result.json.result?.to).toBe(first.json.result?.releaseId);
    expect(linked()).toBe(first.json.result?.releaseId);
  });
});
