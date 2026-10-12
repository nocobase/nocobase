// `<bin> update` for a CLI installed alone, and the hint that a newer one is served, against a fake server.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { HEADERS } from '@nocobase/agent-protocol';

import { detectInstallation } from '../src/install.ts';
import { installSkills, type SkillsEnvironment } from '../src/skills.ts';
import {
  HINT_INTERVAL_MS,
  updateCli,
  updateHint,
  type UpdateEnvironment,
} from '../src/update.ts';
import { removeDir, tempDir } from './helpers.ts';

const scratch = tempDir('app-cli-client-update-');
afterAll(() => removeDir(scratch));

const target = 'linux-x64';
const bin = 'acme';
const session = {
  server: 'https://acme.example.com/app',
  headers: { [HEADERS.apiKey]: 'key-1' },
};

function tarball(version: string): Uint8Array {
  const staging = path.join(scratch, `staging-${version}`);
  mkdirSync(path.join(staging, 'acme', 'bin'), { recursive: true });
  mkdirSync(path.join(staging, 'acme', 'skills/nb-studio-cli'), {
    recursive: true,
  });
  writeFileSync(
    path.join(staging, 'acme', 'skills/nb-studio-cli/SKILL.md'),
    `instructions ${version}`,
  );
  const bin = path.join(staging, 'acme', 'bin', 'acme');
  writeFileSync(bin, `#!/bin/sh\necho acme ${version}\n`);
  chmodSync(bin, 0o755);
  const file = path.join(staging, 'out.tar.gz');
  execFileSync('tar', ['-czf', file, '-C', staging, 'acme']);
  return new Uint8Array(readFileSync(file));
}

/** A server serving `version`, which records the requests it gets. */
function fakeServer(version: string) {
  const bytes = tarball(version);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const requests: { url: string; key: string | null }[] = [];
  const file = `/api/agents/dist/products/acme/versions/${version}/files/acme-v${version}-${target}.tar.gz`;
  const fetcher = (async (input: URL | RequestInfo, init?: RequestInit) => {
    const url = new URL(String(input));
    const key = new Headers(init?.headers).get(HEADERS.apiKey);
    requests.push({ url: url.pathname, key });
    if (key !== 'key-1')
      return Response.json(
        { error: { reason: 'UNAUTHORIZED', message: 'Sign in.' } },
        { status: 401 },
      );
    if (url.pathname === `/app/api/agents/dist/products/acme/targets/${target}`)
      return Response.json({
        data: {
          product: 'acme',
          version,
          target,
          url: file,
          sha256,
          size: bytes.length,
          channel: 'stable',
        },
      });
    if (url.pathname === `/app${file}`) return new Response(bytes);
    return new Response('not found', { status: 404 });
  }) as typeof fetch;
  return { fetch: fetcher, requests };
}

/** A CLI installed alone at `version`, as the install script leaves it. */
function installCli(name: string, version: string, mode = 'cli') {
  const prefix = path.join(scratch, name);
  const dir = path.join(prefix, 'versions', version);
  mkdirSync(path.join(dir, 'bin'), { recursive: true });
  writeFileSync(path.join(dir, 'bin', 'acme'), '#!/bin/sh\n');
  symlinkSync(path.join('versions', version), path.join(prefix, 'current'));
  writeFileSync(
    path.join(prefix, 'install.json'),
    JSON.stringify({ prefix, binLink: '/x/acme', mode }),
  );
  return { prefix, installation: detectInstallation(dir) };
}

describe('<bin> update', () => {
  it('keeps the CLI upgrade successful while leaving all overlapping registered copies untouched', async () => {
    const { prefix, installation } = installCli('overlapping-skills', '0.1.0');
    const packageRoot = path.join(prefix, 'versions/0.1.0');
    mkdirSync(path.join(packageRoot, 'skills/nb-studio-cli'), {
      recursive: true,
    });
    writeFileSync(
      path.join(packageRoot, 'skills/nb-studio-cli/SKILL.md'),
      'old instructions',
    );
    const skills: SkillsEnvironment = {
      packageRoot,
      cliVersion: '0.1.0',
      bin,
      stateHome: path.join(prefix, 'state'),
      home: path.join(prefix, 'home'),
      env: { PATH: '' },
    };
    await installSkills(skills, ['codex']);
    const parent = path.join(skills.home!, '.agents/skills/nb-studio-cli');
    const child = path.join(parent, 'claude-config/skills/nb-studio-cli');
    mkdirSync(child, { recursive: true });
    writeFileSync(path.join(child, 'SKILL.md'), 'child instructions');
    const file = path.join(skills.stateHome, 'skills.json');
    const registry = JSON.parse(readFileSync(file, 'utf8'));
    registry.targets.push({
      tool: 'claude',
      path: child,
      hash: 'child-hash',
      cliVersion: '0.0.1',
    });
    writeFileSync(file, JSON.stringify(registry));
    const before = readFileSync(file, 'utf8');
    const result = await updateCli(
      session,
      {
        bin,
        running: '0.1.0',
        installation,
        target,
        skills,
        fetch: fakeServer('0.2.0').fetch,
      },
      {},
    );
    expect(result.updated).toBe(true);
    expect(readlinkSync(path.join(prefix, 'current'))).toBe('versions/0.2.0');
    expect(result.skills?.targets.map((target) => target.action)).toEqual([
      'failed',
      'failed',
    ]);
    expect(result.skills?.warnings).toHaveLength(2);
    expect(result.skills?.warnings.join('')).toContain('contain one another');
    expect(readFileSync(path.join(parent, 'SKILL.md'), 'utf8')).toBe(
      'old instructions',
    );
    expect(readFileSync(path.join(child, 'SKILL.md'), 'utf8')).toBe(
      'child instructions',
    );
    expect(readFileSync(file, 'utf8')).toBe(before);
  });

  it('syncs from the newly activated tarball and preserves the CLI upgrade and old Skill on a sync failure', async () => {
    for (const fail of [false, true]) {
      const { prefix, installation } = installCli(`skills-${fail}`, '0.1.0');
      const packageRoot = path.join(prefix, 'versions/0.1.0');
      mkdirSync(path.join(packageRoot, 'skills/nb-studio-cli'), {
        recursive: true,
      });
      writeFileSync(
        path.join(packageRoot, 'skills/nb-studio-cli/SKILL.md'),
        'old instructions',
      );
      const skills: SkillsEnvironment = {
        packageRoot,
        cliVersion: '0.1.0',
        bin,
        stateHome: path.join(prefix, 'state'),
        home: path.join(prefix, 'home'),
        env: { PATH: '' },
      };
      await installSkills(skills, ['codex']);
      const destination = path.join(
        skills.home!,
        '.agents/skills/nb-studio-cli',
      );
      const other = path.join(skills.home!, '.agents/skills/my-own-skill');
      mkdirSync(other);
      writeFileSync(path.join(other, 'SKILL.md'), 'preserve');
      // A competing operation fails the Skill sync but cannot invalidate the activated CLI.
      if (fail)
        mkdirSync(path.join(path.dirname(destination), '.nb-studio-cli.lock'));
      const server = fakeServer('0.2.0');
      const environment: UpdateEnvironment = {
        bin,
        running: '0.1.0',
        installation,
        target,
        skills,
        fetch: server.fetch,
      };
      expect(
        (await updateCli(session, environment, { check: true })).skills,
      ).toBeUndefined();
      expect(readFileSync(path.join(destination, 'SKILL.md'), 'utf8')).toBe(
        'old instructions',
      );
      const result = await updateCli(session, environment, {});
      expect(result.updated).toBe(true);
      expect(readlinkSync(path.join(prefix, 'current'))).toBe('versions/0.2.0');
      expect(result.skills?.targets[0]?.action).toBe(
        fail ? 'failed' : 'updated',
      );
      expect(result.skills?.warnings.length).toBe(fail ? 1 : 0);
      expect(readFileSync(path.join(destination, 'SKILL.md'), 'utf8')).toBe(
        fail ? 'old instructions' : 'instructions 0.2.0',
      );
      expect(readFileSync(path.join(other, 'SKILL.md'), 'utf8')).toBe(
        'preserve',
      );
    }
  });

  it('updates a CLI installed alone, keeping the previous version', async () => {
    const { prefix, installation } = installCli('cli', '0.1.0');
    expect(installation?.mode).toBe('cli');
    const server = fakeServer('0.2.0');
    const environment: UpdateEnvironment = {
      bin,
      running: '0.1.0',
      installation,
      target,
      fetch: server.fetch,
    };
    const checked = await updateCli(session, environment, { check: true });
    expect(checked).toEqual({
      current: '0.1.0',
      latest: '0.2.0',
      updated: false,
    });
    expect(readlinkSync(path.join(prefix, 'current'))).toBe('versions/0.1.0');

    const lines: string[] = [];
    const result = await updateCli(session, environment, {
      log: (line) => lines.push(line),
    });
    expect(result).toEqual({
      current: '0.1.0',
      latest: '0.2.0',
      updated: true,
      previous: '0.1.0',
    });
    expect(readlinkSync(path.join(prefix, 'current'))).toBe('versions/0.2.0');
    expect(
      readFileSync(path.join(prefix, 'versions/0.2.0/bin/acme'), 'utf8'),
    ).toContain('acme 0.2.0');
    expect(existsSync(path.join(prefix, 'versions/0.1.0'))).toBe(true);
    expect(lines.join('\n')).toContain('Updated acme 0.1.0 → 0.2.0');
    expect(server.requests.every((request) => request.key === 'key-1')).toBe(
      true,
    );

    expect(
      await updateCli(
        session,
        { ...environment, running: '0.2.0' },
        { log: (line) => lines.push(line) },
      ),
    ).toMatchObject({ updated: false });
    expect(lines.at(-1)).toContain('is up to date');
  });

  it('leaves a runner installation to the runner, and refuses an install it did not make', async () => {
    const runner = installCli('runner', '0.1.0', 'runner');
    const server = fakeServer('0.2.0');
    await expect(
      updateCli(
        session,
        {
          bin,
          running: '0.1.0',
          installation: runner.installation,
          target,
          fetch: server.fetch,
        },
        {},
      ),
    ).rejects.toThrow('installed for a runner');
    await expect(
      updateCli(session, { bin, running: '0.1.0', target }, {}),
    ).rejects.toThrow('was not installed by the install script');
    expect(server.requests).toEqual([]);
  });
});

describe('update hint', () => {
  it('says a newer acme is served, asking the server at most twice a day', async () => {
    const { installation } = installCli('hint', '0.1.0');
    const server = fakeServer('0.2.0');
    let now = 1_000_000;
    const environment: UpdateEnvironment = {
      bin,
      running: '0.1.0',
      installation,
      target,
      fetch: server.fetch,
      cacheFile: path.join(scratch, 'hint-cache.json'),
      now: () => now,
    };
    const hint = 'A newer acme (0.2.0) is available; run `acme update`.';
    expect(await updateHint(session, environment)).toBe(hint);
    expect(await updateHint(session, environment)).toBe(hint);
    expect(server.requests).toHaveLength(1);
    expect(
      await updateHint(session, { ...environment, running: '0.2.0' }),
    ).toBeUndefined();
    now += HINT_INTERVAL_MS;
    await updateHint(session, environment);
    expect(server.requests).toHaveLength(2);
    // Nothing for a runner's installation, which updates itself, or for one the script did not make.
    const runner = installCli('hint-runner', '0.1.0', 'runner');
    expect(
      await updateHint(session, {
        ...environment,
        installation: runner.installation,
      }),
    ).toBeUndefined();
    expect(
      await updateHint(session, { ...environment, installation: undefined }),
    ).toBeUndefined();
    // A server that cannot answer gives no hint.
    expect(
      await updateHint(
        { ...session, headers: { [HEADERS.apiKey]: 'other' } },
        { ...environment, cacheFile: path.join(scratch, 'other.json') },
      ),
    ).toBeUndefined();
  });
});
