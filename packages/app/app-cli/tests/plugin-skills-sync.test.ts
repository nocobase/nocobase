import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { applySkillsSync, planSkillsSync } from '../src/lib/skills-sync.ts';

it('synchronizes a plugin skill shipped by the workspace', async () => {
  const appRoot = await mkdtemp(path.join(os.tmpdir(), 'nb3-plugin-skills-'));
  const pluginDirectory = fileURLToPath(
    new URL('../../../plugins/app-plugin-scheduler/', import.meta.url),
  );
  const skillName = 'nocobase-app-plugin-scheduler';

  try {
    const plan = await planSkillsSync({
      appRoot,
      appPackageName: 'test-app',
      plugins: [
        { packageName: '@nocobase/app-plugin-scheduler', pluginDirectory },
      ],
    });
    expect(plan.copies.map((copy) => copy.skillName)).toEqual([skillName]);
    await applySkillsSync(plan);

    const sourceRoot = path.join(pluginDirectory, 'skills', skillName);
    const targetRoot = path.join(appRoot, '.agents', 'skills', skillName);
    for (const file of plan.copies[0]!.files) {
      expect(await readFile(path.join(targetRoot, file), 'utf8')).toBe(
        await readFile(path.join(sourceRoot, file), 'utf8'),
      );
    }
    expect(await readFile(path.join(targetRoot, 'SKILL.md'), 'utf8')).toContain(
      `\nname: ${skillName}\n`,
    );
  } finally {
    await rm(appRoot, { recursive: true, force: true });
  }
});
