import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import {
  CLI_SKILL_FILE,
  readCliSkill,
  registerCliSkill,
} from '../../server/agents/cli-skill.js';

describe('nb-studio-cli skill', () => {
  it('is the skill the packaged nb-studio ships to runners', () => {
    const manifest = JSON.parse(
      readFileSync(
        path.resolve(import.meta.dirname, '../../package.json'),
        'utf8',
      ),
    ) as { nocobase: { cli: { bin: string; skills: string[] } } };
    expect(manifest.nocobase.cli.bin).toBe('nb-studio');
    expect(
      manifest.nocobase.cli.skills.map((dir) =>
        path.resolve(import.meta.dirname, '../..', dir, 'SKILL.md'),
      ),
    ).toEqual([CLI_SKILL_FILE]);
  });

  it('registers it for online runs', () => {
    const register = vi.fn(() => () => undefined);
    registerCliSkill({
      online: { skills: { register } },
    } as unknown as Parameters<typeof registerCliSkill>[0]);
    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'nb-studio-cli',
        markdown: readCliSkill(),
      }),
    );
  });
});
