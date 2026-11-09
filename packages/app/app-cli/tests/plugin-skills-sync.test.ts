import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { applySkillsSync, planSkillsSync } from '../src/lib/skills-sync.ts';

// A plugin laid out the way a workspace plugin ships its Skill — `skills/<name>/SKILL.md` with references beside it —
// written into a temporary directory, so the test reads no other package's directory.
it.each(['plugin', 'module'])(
  'synchronizes an app-%s skill shipped by the workspace',
  async (kind) => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'nb3-plugin-skills-'));
    const appRoot = path.join(root, 'app');
    const pluginDirectory = path.join(root, 'plugins', `app-${kind}-reports`);
    const packageName = `@nocobase/app-${kind}-reports`;
    const skillName = `nocobase-app-${kind}-reports`;
    const sourceRoot = path.join(pluginDirectory, 'skills', skillName);

    try {
      await mkdir(appRoot, { recursive: true });
      await mkdir(path.join(sourceRoot, 'references'), { recursive: true });
      await writeFile(
        path.join(pluginDirectory, 'package.json'),
        JSON.stringify({ name: packageName, version: '1.0.0' }),
      );
      await writeFile(
        path.join(sourceRoot, 'SKILL.md'),
        `---\nname: ${skillName}\ndescription: Builds reports.\n---\n\nRead references/reports.md first.\n`,
      );
      await writeFile(
        path.join(sourceRoot, 'references', 'reports.md'),
        '# Reports\n\nA report is a saved query.\n',
      );

      const plan = await planSkillsSync({
        appRoot,
        appPackageName: 'test-app',
        plugins: [{ packageName, pluginDirectory }],
      });
      expect(plan.copies.map((copy) => copy.skillName)).toEqual([skillName]);
      expect([...plan.copies[0]!.files].sort()).toEqual([
        'SKILL.md',
        path.join('references', 'reports.md'),
      ]);
      await applySkillsSync(plan);

      const targetRoot = path.join(appRoot, '.agents', 'skills', skillName);
      for (const file of plan.copies[0]!.files) {
        expect(await readFile(path.join(targetRoot, file), 'utf8')).toBe(
          await readFile(path.join(sourceRoot, file), 'utf8'),
        );
      }
      expect(
        await readFile(path.join(targetRoot, 'SKILL.md'), 'utf8'),
      ).toContain(`\nname: ${skillName}\n`);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);
