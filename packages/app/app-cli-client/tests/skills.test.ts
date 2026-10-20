import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { rename } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import { COMMANDS, defineCommands } from '../src/commands.ts';
import { AGENTS } from '@nocobase/acp-bridge';
import {
  installSkills,
  prepareSessionSkill,
  sessionSkillInstructions,
  skillsStatus,
  syncInstalledSkills,
  type SkillsEnvironment,
} from '../src/skills.ts';
import { removeDir, tempDir, TEST_CLI } from './helpers.ts';

vi.mock('node:fs/promises', async (original) => {
  const fs = await original<typeof import('node:fs/promises')>();
  return { ...fs, rename: vi.fn(fs.rename) };
});
afterEach(() => vi.mocked(rename).mockReset());

const scratch = tempDir('skills-');
afterAll(() => removeDir(scratch));
let sequence = 0;
function fixture(): SkillsEnvironment {
  const root = path.join(scratch, String(sequence++));
  const packageRoot = path.join(root, 'package');
  mkdirSync(path.join(packageRoot, 'skills/nb-studio-cli/references'), {
    recursive: true,
  });
  writeFileSync(
    path.join(packageRoot, 'skills/nb-studio-cli/SKILL.md'),
    'current instructions',
  );
  writeFileSync(
    path.join(packageRoot, 'skills/nb-studio-cli/references/example.md'),
    'example',
  );
  return {
    packageRoot,
    cliVersion: '1.0.0',
    bin: 'acme',
    stateHome: path.join(root, 'state'),
    home: path.join(root, 'home'),
    env: { PATH: '' },
  };
}
function copy(target: string, text = 'old instructions'): void {
  mkdirSync(target, { recursive: true });
  writeFileSync(path.join(target, 'SKILL.md'), text);
}
function codex(env: SkillsEnvironment): string {
  return path.join(env.home!, '.agents/skills/nb-studio-cli');
}
function claude(env: SkillsEnvironment): string {
  return path.join(env.home!, '.claude/skills/nb-studio-cli');
}
function record(env: SkillsEnvironment): {
  targets: { path: string; tool: string; cliVersion: string; hash: string }[];
} {
  return JSON.parse(
    readFileSync(path.join(env.stateHome, 'skills.json'), 'utf8'),
  );
}

function nestedFixture(direction: 'codex-parent' | 'claude-parent'): {
  env: SkillsEnvironment;
  parent: string;
  child: string;
  parentTool: string;
  childTool: string;
} {
  const base = fixture();
  if (direction === 'codex-parent') {
    const parent = codex(base);
    const config = path.join(parent, 'claude-config');
    return {
      env: { ...base, env: { PATH: '', CLAUDE_CONFIG_DIR: config } },
      parent,
      child: path.join(config, 'skills/nb-studio-cli'),
      parentTool: 'codex',
      childTool: 'claude',
    };
  }
  const parent = claude(base);
  const env = {
    ...base,
    home: path.join(parent, 'codex-home'),
    env: { PATH: '', CLAUDE_CONFIG_DIR: path.join(base.home!, '.claude') },
  };
  return {
    env,
    parent,
    child: codex(env),
    parentTool: 'claude',
    childTool: 'codex',
  };
}

describe('overlapping Skill destinations', () => {
  it('preflights both parent directions before installing any target, including dry-run', async () => {
    for (const direction of ['codex-parent', 'claude-parent'] as const) {
      for (const dryRun of [false, true]) {
        const { env, parent, child } = nestedFixture(direction);
        copy(parent, 'parent instructions');
        copy(child, 'child instructions');
        const neighbor = path.join(path.dirname(parent), 'my-own-skill');
        copy(neighbor, 'preserve neighbor');
        writeFileSync(path.join(parent, 'settings.json'), 'preserve settings');
        await expect(installSkills(env, ['all'], dryRun)).rejects.toMatchObject(
          { code: 'SKILLS_TARGET_OVERLAP', exit: 5 },
        );
        expect(readFileSync(path.join(parent, 'SKILL.md'), 'utf8')).toBe(
          'parent instructions',
        );
        expect(readFileSync(path.join(child, 'SKILL.md'), 'utf8')).toBe(
          'child instructions',
        );
        expect(readFileSync(path.join(parent, 'settings.json'), 'utf8')).toBe(
          'preserve settings',
        );
        expect(readFileSync(path.join(neighbor, 'SKILL.md'), 'utf8')).toBe(
          'preserve neighbor',
        );
        expect(existsSync(path.join(env.stateHome, 'skills.json'))).toBe(false);
        if (dryRun) expect(existsSync(env.stateHome)).toBe(false);
      }
    }
  });

  it('checks existing registrations for sequential installs in either order and preserves the original record', async () => {
    for (const direction of ['codex-parent', 'claude-parent'] as const) {
      for (const first of ['parent', 'child'] as const) {
        const { env, parent, child, parentTool, childTool } =
          nestedFixture(direction);
        await installSkills(env, [first === 'parent' ? parentTool : childTool]);
        const installed = first === 'parent' ? parent : child;
        const before = readFileSync(
          path.join(env.stateHome, 'skills.json'),
          'utf8',
        );
        const neighbor = path.join(path.dirname(parent), 'my-own-skill');
        copy(neighbor, 'preserve neighbor');
        const next = first === 'parent' ? childTool : parentTool;
        for (const dryRun of [true, false]) {
          await expect(
            installSkills(env, [next], dryRun),
          ).rejects.toMatchObject({ code: 'SKILLS_TARGET_OVERLAP' });
          expect(readFileSync(path.join(installed, 'SKILL.md'), 'utf8')).toBe(
            'current instructions',
          );
          expect(
            readFileSync(path.join(env.stateHome, 'skills.json'), 'utf8'),
          ).toBe(before);
          expect(readFileSync(path.join(neighbor, 'SKILL.md'), 'utf8')).toBe(
            'preserve neighbor',
          );
        }
      }
    }
  });

  it('deduplicates equal normalized destinations instead of treating them as nested', async () => {
    const base = fixture();
    const env = {
      ...base,
      env: {
        PATH: '',
        CLAUDE_CONFIG_DIR: path.join(base.home!, '.agents', 'unused', '..'),
      },
    };
    const installed = await installSkills(env, ['all']);
    expect(installed.targets).toHaveLength(1);
    expect(installed.targets[0]).toMatchObject({
      tool: 'codex',
      path: codex(env),
      present: true,
      upToDate: true,
    });
    const original = record(env).targets[0]!;
    writeFileSync(
      path.join(env.stateHome, 'skills.json'),
      JSON.stringify({
        skill: 'nb-studio-cli',
        targets: [
          {
            ...original,
            path: `${path.dirname(original.path)}//nb-studio-cli`,
          },
        ],
      }),
    );
    expect((await installSkills(env, ['all'])).targets[0]?.action).toBe(
      'unchanged',
    );
    expect(record(env).targets).toHaveLength(1);
  });

  it('reads the winning concurrent registration before retrying an overlapping install', async () => {
    const { env, parent, child, parentTool, childTool } =
      nestedFixture('codex-parent');
    const results = await Promise.allSettled([
      installSkills(env, [parentTool]),
      installSkills(env, [childTool]),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.find((result) => result.status === 'rejected'),
    ).toMatchObject({ reason: { code: 'SKILLS_BUSY' } });
    const parentWon = results[0]?.status === 'fulfilled';
    const before = readFileSync(
      path.join(env.stateHome, 'skills.json'),
      'utf8',
    );
    await expect(
      installSkills(env, [parentWon ? childTool : parentTool]),
    ).rejects.toMatchObject({ code: 'SKILLS_TARGET_OVERLAP' });
    expect(
      readFileSync(path.join(parentWon ? parent : child, 'SKILL.md'), 'utf8'),
    ).toBe('current instructions');
    expect(readFileSync(path.join(env.stateHome, 'skills.json'), 'utf8')).toBe(
      before,
    );
  });

  it('skips every conflicting registered copy before synchronization and updates unrelated destinations', async () => {
    for (const direction of ['codex-parent', 'claude-parent'] as const) {
      for (const reverse of [false, true]) {
        const { env, parent, child, parentTool, childTool } =
          nestedFixture(direction);
        await installSkills(env, [parentTool]);
        const original = record(env).targets[0]!;
        copy(child, 'child instructions');
        const independent = path.join(
          path.dirname(env.packageRoot),
          'independent/skills/nb-studio-cli',
        );
        copy(independent, 'independent instructions');
        const conflicted = [
          original,
          {
            tool: childTool,
            path: child,
            hash: 'child-hash',
            cliVersion: '0.5.0',
          },
        ];
        if (reverse) conflicted.reverse();
        writeFileSync(
          path.join(env.stateHome, 'skills.json'),
          JSON.stringify({
            skill: 'nb-studio-cli',
            targets: [
              ...conflicted,
              {
                tool: 'codex',
                path: independent,
                hash: 'independent-hash',
                cliVersion: '0.5.0',
              },
            ],
          }),
        );
        const before = readFileSync(
          path.join(env.stateHome, 'skills.json'),
          'utf8',
        );
        const unregisteredConfig = path.join(
          path.dirname(env.packageRoot),
          'new-claude-config',
        );
        for (const dryRun of [true, false]) {
          await expect(
            installSkills(
              {
                ...env,
                env: { PATH: '', CLAUDE_CONFIG_DIR: unregisteredConfig },
              },
              ['claude'],
              dryRun,
            ),
          ).rejects.toMatchObject({ code: 'SKILLS_TARGET_OVERLAP' });
          expect(
            readFileSync(path.join(env.stateHome, 'skills.json'), 'utf8'),
          ).toBe(before);
          expect(existsSync(unregisteredConfig)).toBe(false);
        }
        const neighbor = path.join(path.dirname(parent), 'my-own-skill');
        copy(neighbor, 'preserve neighbor');
        writeFileSync(
          path.join(env.packageRoot, 'skills/nb-studio-cli/SKILL.md'),
          'new instructions',
        );
        const result = await syncInstalledSkills({
          ...env,
          cliVersion: '2.0.0',
        });
        expect(result.targets.map((target) => target.action)).toEqual([
          'failed',
          'failed',
          'updated',
        ]);
        for (const failure of result.targets.slice(0, 2)) {
          expect(failure.error).toContain('contain one another');
          expect(failure.error).toContain(parent);
          expect(failure.error).toContain(child);
        }
        expect(result.warnings).toHaveLength(2);
        expect(result.warnings.join('')).toContain('acme skills install');
        expect(
          record(env).targets.filter((target) => target.path !== independent),
        ).toEqual(conflicted);
        expect(readFileSync(path.join(parent, 'SKILL.md'), 'utf8')).toBe(
          'current instructions',
        );
        expect(readFileSync(path.join(child, 'SKILL.md'), 'utf8')).toBe(
          'child instructions',
        );
        expect(readFileSync(path.join(independent, 'SKILL.md'), 'utf8')).toBe(
          'new instructions',
        );
        expect(readFileSync(path.join(neighbor, 'SKILL.md'), 'utf8')).toBe(
          'preserve neighbor',
        );
      }
    }
  });
});

describe('local Skill installation', () => {
  it('installs both tools, repeats without rewriting the Skill, replaces obsolete contents, and preserves neighbors', async () => {
    const env = fixture();
    const neighbor = path.join(env.home!, '.agents/skills/my-own-skill');
    copy(neighbor, 'my own instructions');
    const first = await installSkills(env, ['all']);
    expect(first.targets.map((target) => target.action)).toEqual([
      'install',
      'install',
    ]);
    expect(
      readFileSync(path.join(codex(env), 'references/example.md'), 'utf8'),
    ).toBe('example');
    const mtime = statSync(path.join(codex(env), 'SKILL.md')).mtimeMs;
    expect(
      (await installSkills(env, ['codex', 'claude', 'codex'])).targets.every(
        (target) => target.action === 'unchanged',
      ),
    ).toBe(true);
    expect(statSync(path.join(codex(env), 'SKILL.md')).mtimeMs).toBe(mtime);
    copy(codex(env), 'edited locally');
    writeFileSync(path.join(codex(env), 'obsolete.md'), 'obsolete');
    expect((await skillsStatus(env, ['codex'])).targets[0]).toMatchObject({
      present: true,
      upToDate: false,
      registered: true,
    });
    expect((await installSkills(env, ['codex'])).targets[0]?.action).toBe(
      'update',
    );
    expect(existsSync(path.join(codex(env), 'obsolete.md'))).toBe(false);
    expect(readFileSync(path.join(neighbor, 'SKILL.md'), 'utf8')).toBe(
      'my own instructions',
    );
    expect(record(env).targets).toHaveLength(2);
  });

  it('detects configuration directories and variables without redirecting the Codex default', async () => {
    const base = fixture();
    const env = {
      ...base,
      env: {
        PATH: '',
        CLAUDE_CONFIG_DIR: path.join(base.home!, 'custom claude'),
        CODEX_HOME: path.join(base.home!, 'custom codex'),
      },
    };
    const result = await installSkills(env);
    expect(result.targets.map((target) => target.path)).toEqual([
      path.join(env.env.CLAUDE_CONFIG_DIR, 'skills/nb-studio-cli'),
      codex(env),
    ]);
    expect(existsSync(env.env.CODEX_HOME)).toBe(false);
    const other = fixture();
    mkdirSync(path.join(other.home!, '.codex'), { recursive: true });
    expect(
      (await installSkills(other)).targets.map((target) => target.tool),
    ).toEqual(['codex']);
  });

  it('detects executable tools on PATH, including a symlink to an executable', async () => {
    const env = fixture();
    const binaries = path.join(env.home!, 'bin');
    mkdirSync(binaries, { recursive: true });
    writeFileSync(path.join(binaries, 'actual'), '#!/bin/sh\n');
    chmodSync(path.join(binaries, 'actual'), 0o755);
    symlinkSync('actual', path.join(binaries, 'claude'));
    const result = await installSkills({ ...env, env: { PATH: binaries } });
    expect(result.targets.map((target) => target.tool)).toEqual(['claude']);
  });

  it('does not treat the shared .agents directory as Codex detection; gives executable suggestions and allows explicit selection', async () => {
    const env = fixture();
    mkdirSync(path.join(env.home!, '.agents/skills'), { recursive: true });
    await expect(installSkills(env)).rejects.toMatchObject({
      code: 'SKILLS_NO_TOOL',
      exit: 5,
      suggestions: [
        {
          run: {
            command: 'acme',
            args: ['skills', 'install', '--tool', 'claude'],
          },
        },
        {
          run: {
            command: 'acme',
            args: ['skills', 'install', '--tool', 'codex'],
          },
        },
      ],
    });
    expect(existsSync(env.stateHome)).toBe(false);
    expect((await installSkills(env, ['codex'])).targets[0]?.path).toBe(
      codex(env),
    );
    await expect(installSkills(env, ['other'])).rejects.toMatchObject({
      code: 'SKILLS_INVALID_TOOL',
    });
  });

  it('dry-run and status write nothing, including locks, target directories, and state', async () => {
    const env = fixture();
    expect(
      (await installSkills(env, ['all'], true)).targets.map(
        (target) => target.action,
      ),
    ).toEqual(['install', 'install']);
    expect(
      (await skillsStatus(env)).targets.every((target) => !target.present),
    ).toBe(true);
    expect(existsSync(env.home!)).toBe(false);
    expect(existsSync(env.stateHome)).toBe(false);
    await installSkills(env, ['codex']);
    copy(codex(env));
    const before = readFileSync(
      path.join(env.stateHome, 'skills.json'),
      'utf8',
    );
    expect(
      (await installSkills(env, ['codex'], true)).targets[0],
    ).toMatchObject({ action: 'update', upToDate: false });
    expect(readFileSync(path.join(codex(env), 'SKILL.md'), 'utf8')).toBe(
      'old instructions',
    );
    expect(readFileSync(path.join(env.stateHome, 'skills.json'), 'utf8')).toBe(
      before,
    );
  });

  it('exposes commands only when the package ships nb-studio-cli, not arbitrary Skills', () => {
    const env = fixture();
    defineCommands({
      ...TEST_CLI,
      selfUpdate: { packageRoot: env.packageRoot },
    });
    expect(COMMANDS['skills:install']).toBeDefined();
    expect(COMMANDS['skills:status']).toBeDefined();
    rmSync(path.join(env.packageRoot, 'skills/nb-studio-cli'), {
      recursive: true,
    });
    copy(path.join(env.packageRoot, 'skills/other'));
    defineCommands({
      ...TEST_CLI,
      selfUpdate: { packageRoot: env.packageRoot },
    });
    expect(COMMANDS['skills:install']).toBeUndefined();
  });
});

describe('Skill synchronization and filesystem boundaries', () => {
  it('keeps an unwritable old copy and continues synchronizing other registered targets', async () => {
    if (process.getuid?.() === 0) return;
    const env = fixture();
    await installSkills(env, ['all']);
    writeFileSync(
      path.join(env.packageRoot, 'skills/nb-studio-cli/SKILL.md'),
      'new instructions',
    );
    const parent = path.dirname(claude(env));
    chmodSync(parent, 0o555);
    try {
      const result = await syncInstalledSkills({ ...env, cliVersion: '2.0.0' });
      expect(result.targets.map((target) => target.action)).toEqual([
        'failed',
        'updated',
      ]);
      expect(result.warnings.join('')).toContain('skills install');
      expect(readFileSync(path.join(claude(env), 'SKILL.md'), 'utf8')).toBe(
        'current instructions',
      );
      expect(readFileSync(path.join(codex(env), 'SKILL.md'), 'utf8')).toBe(
        'new instructions',
      );
    } finally {
      chmodSync(parent, 0o755);
    }
  });

  it('reports manual new and legacy copies, syncs registered legacy paths, and does not create or migrate old copies', async () => {
    const env = fixture();
    const legacy = path.join(env.home!, '.codex/skills/nb-studio-cli');
    copy(legacy);
    copy(claude(env));
    await installSkills(env, ['codex']);
    expect(readFileSync(path.join(legacy, 'SKILL.md'), 'utf8')).toBe(
      'old instructions',
    );
    const status = await skillsStatus(env, ['codex']);
    expect(status.targets).toMatchObject([
      { path: codex(env), legacy: false, registered: true, upToDate: true },
      { path: legacy, legacy: true, registered: false, upToDate: false },
    ]);
    writeFileSync(
      path.join(env.packageRoot, 'skills/nb-studio-cli/SKILL.md'),
      'new instructions',
    );
    const synced = await syncInstalledSkills({ ...env, cliVersion: '2.0.0' });
    expect(synced.targets).toEqual([
      { tool: 'codex', path: codex(env), action: 'updated' },
    ]);
    expect(synced.warnings.join('\n')).toContain(legacy);
    expect(synced.warnings.join('\n')).toContain(claude(env));
    expect(synced.warnings.join('\n')).toContain('acme skills install');
    const registry = record(env);
    registry.targets.push({
      tool: 'codex',
      path: legacy,
      hash: 'old',
      cliVersion: '0.5.0',
    });
    writeFileSync(
      path.join(env.stateHome, 'skills.json'),
      JSON.stringify({ skill: 'nb-studio-cli', ...registry }),
    );
    expect(
      (await syncInstalledSkills({ ...env, cliVersion: '2.0.0' })).targets,
    ).toEqual([
      { tool: 'codex', path: codex(env), action: 'unchanged' },
      { tool: 'codex', path: legacy, action: 'updated' },
    ]);
    expect(readFileSync(path.join(legacy, 'SKILL.md'), 'utf8')).toBe(
      'new instructions',
    );
    const custom = {
      ...env,
      env: { PATH: '', CODEX_HOME: path.join(env.home!, 'elsewhere') },
    };
    expect(
      (await skillsStatus(custom, ['codex'])).targets.map(
        (target) => target.path,
      ),
    ).toContain(legacy);
    const fresh = fixture();
    expect(await syncInstalledSkills(fresh)).toEqual({
      targets: [],
      warnings: [],
    });
    expect(existsSync(fresh.stateHome)).toBe(false);
  });

  it('rejects destination, parent, dangling, source, and nested links without changing their referents', async () => {
    for (const kind of [
      'destination',
      'parent',
      'dangling',
      'source',
      'nested',
      'file',
    ]) {
      const env = fixture();
      const outside = path.join(env.home!, 'outside');
      copy(outside, 'preserve');
      if (kind === 'parent')
        symlinkSync(outside, path.join(env.home!, '.agents'));
      else if (kind === 'source')
        symlinkSync(
          outside,
          path.join(env.packageRoot, 'skills/nb-studio-cli/link'),
        );
      else {
        mkdirSync(path.dirname(codex(env)), { recursive: true });
        if (kind === 'nested') {
          copy(codex(env));
          symlinkSync(outside, path.join(codex(env), 'link'));
        } else if (kind === 'file') writeFileSync(codex(env), 'preserve file');
        else
          symlinkSync(
            kind === 'dangling' ? path.join(env.home!, 'missing') : outside,
            codex(env),
          );
      }
      await expect(installSkills(env, ['codex'])).rejects.toMatchObject({
        code: 'SKILLS_UNSAFE_PATH',
      });
      expect(readFileSync(path.join(outside, 'SKILL.md'), 'utf8')).toBe(
        'preserve',
      );
      expect(existsSync(path.join(env.stateHome, 'skills.json'))).toBe(false);
    }
  });

  it('rejects package/state overlap and malformed installation records', async () => {
    const env = fixture();
    await expect(
      installSkills(
        { ...env, env: { CLAUDE_CONFIG_DIR: env.packageRoot } },
        ['claude'],
        true,
      ),
    ).rejects.toMatchObject({ code: 'SKILLS_UNSAFE_PATH' });
    await expect(
      installSkills({ ...env, stateHome: codex(env) }, ['codex'], true),
    ).rejects.toMatchObject({ code: 'SKILLS_UNSAFE_PATH' });
    mkdirSync(env.stateHome, { recursive: true });
    writeFileSync(
      path.join(env.stateHome, 'skills.json'),
      JSON.stringify({
        skill: 'nb-studio-cli',
        targets: [{ tool: 'codex', path: env.home, hash: '', cliVersion: '' }],
      }),
    );
    expect((await syncInstalledSkills(env)).warnings.join('')).toContain(
      'Invalid Skill installation record',
    );
    await expect(installSkills(env, ['codex'])).rejects.toMatchObject({
      code: 'SKILLS_INVALID_REGISTRY',
    });
  });

  it('restores the old copy and record if committing the record fails after directory activation', async () => {
    const env = fixture();
    await installSkills(env, ['codex']);
    const before = readFileSync(
      path.join(env.stateHome, 'skills.json'),
      'utf8',
    );
    writeFileSync(
      path.join(env.packageRoot, 'skills/nb-studio-cli/SKILL.md'),
      'new instructions',
    );
    const actual =
      await vi.importActual<typeof import('node:fs/promises')>(
        'node:fs/promises',
      );
    vi.mocked(rename).mockImplementation(async (from, to) => {
      if (to === path.join(env.stateHome, 'skills.json'))
        throw new Error('injected record failure');
      return actual.rename(from, to);
    });
    const result = await syncInstalledSkills({ ...env, cliVersion: '2.0.0' });
    expect(result.targets[0]).toMatchObject({
      action: 'failed',
      error: 'injected record failure',
    });
    expect(result.warnings.join('')).toContain('skills install');
    expect(readFileSync(path.join(codex(env), 'SKILL.md'), 'utf8')).toBe(
      'current instructions',
    );
    expect(readFileSync(path.join(env.stateHome, 'skills.json'), 'utf8')).toBe(
      before,
    );
    expect(readdirSync(path.dirname(codex(env)))).toEqual(['nb-studio-cli']);
  });

  it('serializes concurrent installs without dropping registrations and refuses existing locks', async () => {
    const env = fixture();
    const attempts = await Promise.allSettled([
      installSkills(env, ['claude']),
      installSkills(env, ['codex']),
    ]);
    expect(
      attempts.filter((attempt) => attempt.status === 'fulfilled'),
    ).toHaveLength(1);
    const failed = attempts.find((attempt) => attempt.status === 'rejected');
    expect(failed).toMatchObject({ reason: { code: 'SKILLS_BUSY', exit: 6 } });
    await installSkills(env, ['all']);
    expect(record(env).targets).toHaveLength(2);
    mkdirSync(path.join(path.dirname(codex(env)), '.nb-studio-cli.lock'));
    await expect(installSkills(env, ['codex'])).rejects.toMatchObject({
      code: 'SKILLS_BUSY',
    });
    expect(readFileSync(path.join(codex(env), 'SKILL.md'), 'utf8')).toBe(
      'current instructions',
    );
  });
});

it.each(['claude', 'codex'])(
  'prepares missing or stale native session Skills for %s',
  async (agentId) => {
    const environment = fixture();
    await prepareSessionSkill(environment, agentId);
    let status = await skillsStatus(environment);
    expect(
      status.targets.some(
        (target) => target.tool === agentId && target.upToDate,
      ),
    ).toBe(true);
    writeFileSync(
      path.join(environment.packageRoot, 'skills/nb-studio-cli/SKILL.md'),
      'updated session instructions',
    );
    await prepareSessionSkill(environment, agentId);
    status = await skillsStatus(environment);
    expect(
      status.targets.some(
        (target) => target.tool === agentId && target.upToDate,
      ),
    ).toBe(true);
    expect(
      await sessionSkillInstructions(environment, agentId),
    ).toBeUndefined();
  },
);

it.each([
  ...AGENTS.map((agent) => agent.id).filter(
    (id) => !['claude', 'codex'].includes(id),
  ),
  'future-compatible-agent',
])(
  'supplies the current shared instructions for %s without installing files',
  async (agentId) => {
    const environment = fixture();
    await prepareSessionSkill(environment, agentId);
    const instructions = await sessionSkillInstructions(environment, agentId);
    expect(instructions).toContain('current instructions');
    expect(instructions).toContain('bridge-selected profile');
    expect(instructions).toContain(
      path.join(environment.packageRoot, 'skills/nb-studio-cli'),
    );
    writeFileSync(
      path.join(environment.packageRoot, 'skills/nb-studio-cli/SKILL.md'),
      'updated instructions',
    );
    expect(await sessionSkillInstructions(environment, agentId)).toContain(
      'updated instructions',
    );
    expect(existsSync(environment.home!)).toBe(false);
    expect(existsSync(environment.stateHome)).toBe(false);
  },
);

it.each(['missing', 'empty'])(
  'explains how to recover when packaged fallback instructions are %s',
  async (state) => {
    const environment = fixture();
    if (state === 'missing')
      rmSync(path.join(environment.packageRoot, 'skills'), { recursive: true });
    else
      writeFileSync(
        path.join(environment.packageRoot, 'skills/nb-studio-cli/SKILL.md'),
        '  ',
      );
    await expect(
      sessionSkillInstructions(environment, 'opencode'),
    ).rejects.toThrow('Update or reinstall acme');
  },
);
