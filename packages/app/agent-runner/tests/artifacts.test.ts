// Regenerable build artifacts in working directories unused for a while: which directories go, which stay, and the
// settings that choose them.
import { existsSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cleanArtifacts, findArtifacts } from '../src/core/artifacts.ts';
import {
  readWorkspaceMeta,
  checkout,
  writeWorkspaceMeta,
} from '../src/core/checkout.ts';
import { scanWorkspaces } from '../src/core/workspaces.ts';
import {
  parseArtifactPatterns,
  parseArtifactTtl,
} from '../src/commands/config/set.ts';
import {
  artifactPatterns,
  artifactTtlMs,
  DEFAULT_ARTIFACT_PATTERNS,
  DEFAULT_ARTIFACT_TTL_MS,
  readSettings,
  writeSettings,
} from '../src/lib/config.ts';
import { runnerPaths, type RunnerPaths } from '../src/lib/home.ts';
import { git, makeRemote, removeDir, tempDir } from './helpers.ts';

const HOUR = 60 * 60 * 1000;
const NOW = Date.parse('2026-10-12T12:00:00Z');

let root: string;
let paths: RunnerPaths;

beforeEach(() => {
  root = tempDir();
  paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
});
afterEach(() => removeDir(root));

/** A working directory last used `hoursAgo` hours before `NOW`, with a checkout holding artifacts. */
async function workspace(key: string, hoursAgo: number): Promise<string> {
  const remote = makeRemote(root, `remote-${key}`);
  const seed = path.join(root, `remote-${key}-seed`);
  mkdirSync(path.join(seed, 'src'), { recursive: true });
  writeFileSync(path.join(seed, 'src/index.ts'), 'export {};\n');
  writeFileSync(
    path.join(seed, '.gitignore'),
    'node_modules/\n.next/\n.turbo/\n',
  );
  git(['add', '.'], seed);
  git(['commit', '-m', 'publish source and artifact ignore rules'], seed);
  git(['push', remote, 'main'], seed);
  const prepared = await checkout({
    paths,
    appKey: 'app',
    subjectKey: key,
    dirs: [
      {
        kind: 'repo',
        url: remote,
        path: 'app',
        branch: 'main',
        defaultBranch: 'main',
      },
    ],
  });
  const workDir = prepared.workDir;
  await prepared.release();
  for (const dir of [
    'app/node_modules/react',
    'app/packages/web/node_modules/.bin',
    'app/packages/web/.next/cache',
    'app/.turbo',
    'app/src',
  ])
    mkdirSync(path.join(workDir, dir), { recursive: true });
  const meta = await readWorkspaceMeta(paths, workDir);
  await writeWorkspaceMeta(paths, workDir, {
    ...meta!,
    lastUsedAt: new Date(NOW - hoursAgo * HOUR).toISOString(),
  });
  return workDir;
}

const clean = async () =>
  cleanArtifacts(await scanWorkspaces(paths, { now: NOW }), {
    paths,
    ttlMs: 12 * HOUR,
    patterns: DEFAULT_ARTIFACT_PATTERNS,
    now: NOW,
  });

describe('regenerable build artifacts', () => {
  it('preserves artifacts beside unknown source with no recorded repository evidence', async () => {
    const idle = await workspace('PM-unknown', 13);
    const meta = await readWorkspaceMeta(paths, idle);
    await writeWorkspaceMeta(paths, idle, { ...meta!, repos: [] });
    expect(await clean()).toEqual([]);
    expect(existsSync(path.join(idle, 'app/src/index.ts'))).toBe(true);
    expect(existsSync(path.join(idle, 'app/node_modules'))).toBe(true);
  });
  it('removes every matching directory of a directory unused past the TTL, keeping the checkout', async () => {
    const idle = await workspace('PM-1', 13);
    expect(await clean()).toEqual([idle]);
    for (const gone of [
      'app/node_modules',
      'app/packages/web/node_modules',
      'app/packages/web/.next',
      'app/.turbo',
    ])
      expect(existsSync(path.join(idle, gone))).toBe(false);
    expect(existsSync(path.join(idle, 'app/src/index.ts'))).toBe(true);
    expect((await readWorkspaceMeta(paths, idle))?.artifactsCleanedAt).toBe(
      new Date(NOW).toISOString(),
    );
    // Cleaned once: not walked again until a run uses it.
    mkdirSync(path.join(idle, 'app/node_modules'));
    expect(await clean()).toEqual([]);
    expect(existsSync(path.join(idle, 'app/node_modules'))).toBe(true);
  });

  it('keeps a directory used within the TTL', async () => {
    const recent = await workspace('PM-2', 11);
    expect(await clean()).toEqual([]);
    expect(existsSync(path.join(recent, 'app/node_modules'))).toBe(true);
  });

  it('never touches a directory a run holds', async () => {
    const held = await workspace('PM-3', 24);
    mkdirSync(`${held}.lock`);
    writeFileSync(path.join(`${held}.lock`, 'owner'), String(process.pid));
    expect(await clean()).toEqual([]);
    expect(existsSync(path.join(held, 'app/node_modules'))).toBe(true);
  });

  it('neither follows nor removes a symbolic link', async () => {
    const idle = await workspace('PM-4', 24);
    const outside = tempDir('nocobase-runner-outside-');
    try {
      mkdirSync(path.join(outside, 'node_modules/kept'), { recursive: true });
      mkdirSync(path.join(outside, 'deeper/node_modules'), { recursive: true });
      symlinkSync(outside, path.join(idle, 'app/linked'));
      symlinkSync(
        path.join(outside, 'node_modules'),
        path.join(idle, 'app/node_modules-link'),
      );
      expect(await findArtifacts(idle, ['node_modules'])).not.toContain(
        path.join(idle, 'app/linked/deeper/node_modules'),
      );
      await clean();
      expect(existsSync(path.join(outside, 'node_modules/kept'))).toBe(true);
      expect(existsSync(path.join(outside, 'deeper/node_modules'))).toBe(true);
      expect(existsSync(path.join(idle, 'app/linked'))).toBe(true);
    } finally {
      removeDir(outside);
    }
  });

  it('does nothing when turned off', async () => {
    const idle = await workspace('PM-5', 48);
    expect(
      await cleanArtifacts(await scanWorkspaces(paths, { now: NOW }), {
        paths,
        ttlMs: 0,
        patterns: DEFAULT_ARTIFACT_PATTERNS,
        now: NOW,
      }),
    ).toEqual([]);
    expect(existsSync(path.join(idle, 'app/node_modules'))).toBe(true);
  });
});

describe('artifact settings', () => {
  it('defaults to 12 hours and node_modules, .next and .turbo, and keeps what the owner sets', async () => {
    const settings = await readSettings(paths);
    expect(artifactTtlMs(settings)).toBe(DEFAULT_ARTIFACT_TTL_MS);
    expect(DEFAULT_ARTIFACT_TTL_MS).toBe(12 * HOUR);
    expect(artifactPatterns(settings)).toEqual([
      'node_modules',
      '.next',
      '.turbo',
    ]);
    await writeSettings(
      {
        ...settings,
        artifactTtlMs: parseArtifactTtl('2d'),
        artifactPatterns: parseArtifactPatterns('node_modules, dist'),
      },
      paths,
    );
    const saved = await readSettings(paths);
    expect(artifactTtlMs(saved)).toBe(48 * HOUR);
    expect(artifactPatterns(saved)).toEqual(['node_modules', 'dist']);
  });

  it('reads durations and names, and refuses what is not one', () => {
    expect(parseArtifactTtl('30m')).toBe(30 * 60_000);
    expect(parseArtifactTtl('off')).toBe(0);
    expect(() => parseArtifactTtl('12')).toThrow(/artifact-ttl/u);
    expect(parseArtifactPatterns('default')).toEqual([
      ...DEFAULT_ARTIFACT_PATTERNS,
    ]);
    expect(() => parseArtifactPatterns('../etc')).toThrow(/artifact-patterns/u);
    expect(() => parseArtifactPatterns('..')).toThrow(/artifact-patterns/u);
  });
});
