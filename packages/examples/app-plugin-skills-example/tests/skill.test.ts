import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const packageRoot = new URL('../', import.meta.url);
const skillPath = new URL(
  'skills/nocobase-app-plugin-skills-example/SKILL.md',
  packageRoot,
);

describe('@nocobase/app-plugin-skills-example Skill', () => {
  it('documents only real App-facing public surfaces', async () => {
    const [manifestSource, skillSource] = await Promise.all([
      readFile(new URL('package.json', packageRoot), 'utf8'),
      readFile(skillPath, 'utf8'),
    ]);
    const manifest = JSON.parse(manifestSource) as {
      readonly exports?: Record<string, unknown>;
      readonly files?: string[];
    };

    expect(manifest.files).toContain('skills');
    expect(manifest.exports).toHaveProperty('./client/components/app-notice');
    expect(manifest.exports).toHaveProperty('./server/tokens');
    expect(skillSource).toContain(
      '@nocobase/app-plugin-skills-example/client/components/app-notice',
    );
    expect(skillSource).toContain(
      '@nocobase/app-plugin-skills-example/server/tokens',
    );
    expect(skillSource).toContain('GET /api/skillsExample/notice');
    expect(skillSource).toContain('anonymous API request returns `401`');
    expect(skillSource).not.toMatch(/development draft|placeholder|TODO/iu);
  });
});
