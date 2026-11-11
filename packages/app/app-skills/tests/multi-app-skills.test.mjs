import { execFileSync } from 'node:child_process';
import { lstat, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const skillsRoot = join(packageRoot, 'skills');
const names = ['development', 'migration', 'deployment'].map(
  (task) => `nocobase-multi-app-${task}`,
);
const packageManifest = JSON.parse(
  await readFile(join(packageRoot, 'package.json'), 'utf8'),
);

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const path = join(directory, entry.name);
        expect(entry.isSymbolicLink(), path).toBe(false);
        return entry.isDirectory() ? files(path) : [path];
      }),
    )
  ).flat();
}

async function verifyScenario(directory) {
  const sourceFiles = await files(directory);
  for (const path of sourceFiles) {
    const content = await readFile(path, 'utf8');
    expect(content, path).not.toContain('\r');
    expect(content, path).not.toMatch(
      /apps\/main\b|setup:main|dev:main|workspace-owned|project-owned/,
    );
    expect(content, path).not.toMatch(
      /root (?:is not a runtime|orchestrates)|root structural build/i,
    );
    expect(content, path).not.toMatch(
      /\/Users\/|\/private\/tmp\/|file:|link:|workspace:/,
    );
    for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^[a-z][a-z\d+.-]*:/i.test(target)) continue;
      expect(isAbsolute(target), `${path}: ${target}`).toBe(false);
      const destination = resolve(dirname(path), target);
      expect(
        relative(directory, destination),
        `${path}: ${target}`,
      ).not.toMatch(/^\.\.(?:[/\\]|$)/);
      expect((await lstat(destination)).isFile(), `${path}: ${target}`).toBe(
        true,
      );
    }
  }
  const skill = await readFile(join(directory, 'SKILL.md'), 'utf8');
  const metadata = skill.split(/^---\s*$/m)[1];
  expect(metadata).toBeTruthy();
  for (const key of [
    'name',
    'description',
    'argument-hint',
    'allowed-tools',
    'owner',
    'version',
    'last-reviewed',
    'risk-level',
  ]) {
    expect(metadata, key).toMatch(new RegExp(`^${key}:`, 'm'));
  }
  expect(metadata).toMatch(new RegExp(`^name: ${basename(directory)}$`, 'm'));
  const description = metadata.match(/^description:\s*["']?(.+?)['"]?$/m)?.[1];
  expect(description).toBeTruthy();
  expect(description.length).toBeLessThanOrEqual(300);
  expect(skill).toContain(
    'Their presence does not mean an application is Main',
  );
  expect(skill).toContain(
    'installing this shared guidance package grants none of them',
  );
  if (/^risk-level: high$/m.test(metadata))
    expect(skill).toContain('secondary confirmation');
  expect(skill).toMatch(/(?:tool\/security|tool|security) refusal/);
  return sourceFiles;
}

describe('shared multi-app scenario guidance', () => {
  it('preserves embedded historical migration and seed bytes during package formatting', async () => {
    const policy = await readFile(join(packageRoot, '.prettierignore'), 'utf8');
    expect(policy.split('\n')).toContain('**/database/*/migrations/');
    expect(policy.split('\n')).toContain('**/database/*/seeds/');
  });
  it('ships portable, task-gated scenarios with complete local references', async () => {
    const checked = (
      await Promise.all(
        names.map((name) => verifyScenario(join(skillsRoot, name))),
      )
    ).flat();
    expect(checked).toHaveLength(13);
  });

  it('routes from the existing application entry without replacing ordinary development or upgrades', async () => {
    const entry = await readFile(
      join(skillsRoot, 'nocobase-app-development/SKILL.md'),
      'utf8',
    );
    for (const name of names) {
      expect(entry).toContain(`../${name}/SKILL.md`);
    }
    expect(entry).toContain(
      'Merely changing a business feature inside Main or a child remains ordinary application development',
    );
    expect(entry).toContain(
      'business release selection is not a template/framework upgrade',
    );
    expect(entry).toContain('nocobase-app-upgrade');
  });

  it('packs the scenarios through the existing app-skills package', async () => {
    const temporary = await mkdtemp(
      join(tmpdir(), 'nocobase-shared-scenarios-'),
    );
    try {
      const archive = join(temporary, 'skills.tgz');
      execFileSync('pnpm', ['pack', '--out', archive], {
        cwd: packageRoot,
        stdio: 'pipe',
      });
      const paths = execFileSync('tar', ['-tzf', archive], {
        encoding: 'utf8',
      }).split('\n');
      const expected = (
        await Promise.all(names.map((name) => files(join(skillsRoot, name))))
      ).flat();
      for (const path of expected) {
        expect(paths).toContain(
          `package/${relative(packageRoot, path).split(sep).join('/')}`,
        );
      }
      execFileSync('tar', ['-xzf', archive, '-C', temporary]);
      const packed = JSON.parse(
        await readFile(join(temporary, 'package/package.json'), 'utf8'),
      );
      expect(packed.name).toBe(packageManifest.name);
      expect(packed.version).toBe(packageManifest.version);
      expect(
        paths.some((path) => /node_modules|\.agents\/skills/.test(path)),
      ).toBe(false);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  }, 30000);
});
