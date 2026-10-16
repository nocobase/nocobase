import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { cli, cliEnv, removeDir, tempDir } from './helpers.ts';

const scratch = tempDir('packaged-skills-');
afterAll(() => removeDir(scratch));
let sequence = 0;
function fixture() {
  const home = path.join(scratch, String(sequence++));
  mkdirSync(home, { recursive: true });
  // These commands never sign in or fetch a manifest, even with an unreachable configured server.
  const env = cliEnv(path.join(home, '.acme'), {
    HOME: home,
    CODEX_HOME: '',
    CLAUDE_CONFIG_DIR: '',
    PATH: '',
    ACME_SERVER: 'http://127.0.0.1:1',
    ACME_API_KEY: '',
    AGENT_RUN_CREDENTIALS: '',
  });
  return { home, env };
}

describe('packaged offline skills commands', () => {
  it('reports nested-target conflicts in real and dry-run JSON without claiming success or altering copies', async () => {
    const { home, env } = fixture();
    const parent = path.join(home, '.agents/skills/nb-studio-cli');
    const config = path.join(parent, 'claude-config');
    const child = path.join(config, 'skills/nb-studio-cli');
    mkdirSync(child, { recursive: true });
    writeFileSync(path.join(parent, 'SKILL.md'), 'parent instructions');
    writeFileSync(path.join(child, 'SKILL.md'), 'child instructions');
    writeFileSync(path.join(config, 'settings.json'), 'preserve settings');
    const configured = { ...env, CLAUDE_CONFIG_DIR: config };
    for (const dryRun of [true, false]) {
      const result = await cli(
        [
          'skills',
          'install',
          '--tool',
          'all',
          ...(dryRun ? ['--dry-run'] : []),
          '--json',
        ],
        configured,
        { cwd: home },
      );
      expect(result.code).toBe(5);
      expect(JSON.parse(result.stdout)).toMatchObject({
        ok: false,
        status: 'failure',
        error: {
          code: 'SKILLS_TARGET_OVERLAP',
          details: { paths: [child, parent] },
        },
      });
      expect(readFileSync(path.join(parent, 'SKILL.md'), 'utf8')).toBe(
        'parent instructions',
      );
      expect(readFileSync(path.join(child, 'SKILL.md'), 'utf8')).toBe(
        'child instructions',
      );
      expect(readFileSync(path.join(config, 'settings.json'), 'utf8')).toBe(
        'preserve settings',
      );
      expect(existsSync(path.join(home, '.acme/skills.json'))).toBe(false);
      if (dryRun) expect(existsSync(path.join(home, '.acme'))).toBe(false);
    }
  });

  it('returns one JSON envelope for dry-run, first install, repeat, and read-only status without a login', async () => {
    const { home, env } = fixture();
    const dry = await cli(
      ['skills', 'install', '--tool', 'all', '--dry-run', '--json'],
      env,
      { cwd: home },
    );
    expect(dry.code).toBe(0);
    expect(JSON.parse(dry.stdout)).toMatchObject({
      schemaVersion: 1,
      ok: true,
      command: 'skills install',
      status: 'success-noop',
      result: {
        data: {
          dryRun: true,
          targets: [{ action: 'install' }, { action: 'install' }],
        },
      },
      warnings: [],
    });
    expect(existsSync(path.join(home, '.acme'))).toBe(false);
    expect(existsSync(path.join(home, '.agents'))).toBe(false);
    const installed = await cli(
      ['skills', 'install', '--tool', 'claude', '--tool', 'codex', '--json'],
      env,
      { cwd: home },
    );
    expect(installed.code).toBe(0);
    expect(JSON.parse(installed.stdout)).toMatchObject({
      ok: true,
      status: 'success',
      result: {
        data: {
          targets: [
            { tool: 'claude', upToDate: true },
            { tool: 'codex', upToDate: true },
          ],
        },
      },
    });
    expect(
      readFileSync(
        path.join(home, '.agents/skills/nb-studio-cli/SKILL.md'),
        'utf8',
      ),
    ).toContain('synthetic Studio Skill');
    const repeated = await cli(['skills', 'install', '--json'], env, {
      cwd: home,
    });
    expect(repeated.code).toBe(0);
    // Claude is now detected by its configuration directory; .agents alone does not detect Codex.
    expect(JSON.parse(repeated.stdout).result.data.targets).toMatchObject([
      { tool: 'claude', action: 'unchanged' },
    ]);
    const status = await cli(
      ['skills', 'status', '--tool', 'codex', '--json'],
      env,
      { cwd: home },
    );
    expect(status.code).toBe(0);
    expect(JSON.parse(status.stdout).result.data.targets).toMatchObject([
      {
        path: path.join(home, '.agents/skills/nb-studio-cli'),
        present: true,
        upToDate: true,
      },
      {
        path: path.join(home, '.codex/skills/nb-studio-cli'),
        present: false,
        legacy: true,
      },
    ]);
    expect(existsSync(path.join(home, '.acme/config.json'))).toBe(false);
  });

  it('gives no-tool suggestions in the failure envelope and normal text', async () => {
    const { home, env } = fixture();
    const result = await cli(['skills', 'install', '--json'], env, {
      cwd: home,
    });
    expect(result.code).toBe(5);
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: false,
      status: 'failure',
      error: {
        code: 'SKILLS_NO_TOOL',
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
      },
    });
    const text = await cli(['skills', 'install'], env, { cwd: home });
    expect(text.stderr).toContain('acme skills install --tool codex');
  });

  it('blocks installation in a run without reading its token and allows status', async () => {
    const { home, env } = fixture();
    mkdirSync(path.join(home, '.acme'));
    // Invalid contents prove that local commands neither parse the run token nor authenticate.
    writeFileSync(path.join(home, '.acme/run.json'), 'not a credential');
    const result = await cli(
      ['skills', 'install', '--tool', 'codex', '--json'],
      env,
      { cwd: home },
    );
    expect(result.code).toBe(3);
    expect(JSON.parse(result.stdout).error.code).toBe('SKILLS_RUN_FORBIDDEN');
    const status = await cli(['skills', 'status', '--json'], env, {
      cwd: home,
    });
    expect(status.code).toBe(0);
    expect(
      JSON.parse(status.stdout).result.data.targets.every(
        (target: { present: boolean }) => !target.present,
      ),
    ).toBe(true);
    expect(existsSync(path.join(home, '.agents'))).toBe(false);
    const named = fixture();
    const run = path.join(home, '.acme/run.json');
    const outside = await cli(
      ['skills', 'install', '--tool', 'codex', '--json'],
      { ...named.env, AGENT_RUN_CREDENTIALS: run },
      { cwd: named.home },
    );
    expect(outside.code).toBe(3);
  });
});
