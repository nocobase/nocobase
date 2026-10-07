// The skills a run's CLI ships in its own package (`skills/<slug>/SKILL.md`): placed with the run's own skills, unless
// the run brings one of the same slug.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { runnerPaths } from '../src/lib/home.ts';
import type { ApiClient } from '../src/lib/http.ts';
import { cliSkills, placeSkills } from '../src/agent/skills.ts';
import { removeDir, tempDir } from './helpers.ts';

/** A CLI package as an install leaves it: `bin/<name>` declared by its package.json, and its skills. */
function cliPackage(
  root: string,
  name: string,
  manifest: Record<string, unknown>,
  skills: string[],
): string {
  mkdirSync(path.join(root, 'bin'), { recursive: true });
  writeFileSync(path.join(root, 'package.json'), JSON.stringify(manifest));
  const entry = path.join(root, 'bin', 'run.js');
  writeFileSync(entry, '');
  for (const slug of skills) {
    mkdirSync(path.join(root, 'skills', slug), { recursive: true });
    writeFileSync(
      path.join(root, 'skills', slug, 'SKILL.md'),
      `---\nname: ${slug}\n---\n`,
    );
  }
  mkdirSync(path.join(root, 'skills', 'no-skill-file'), { recursive: true });
  return entry;
}

describe('the skills a CLI ships', () => {
  let home: string;
  afterEach(() => removeDir(home));

  it('reads them from the package that declares the command, through links', async () => {
    home = tempDir('runner-cli-skills-');
    const entry = cliPackage(
      path.join(home, 'pkg'),
      'appcli',
      { name: '@acme/appcli', bin: { appcli: './bin/run.js' } },
      ['appcli-cli', 'other'],
    );
    const link = path.join(home, 'appcli');
    symlinkSync(entry, link);
    const skills = cliSkills(link, 'appcli');
    expect(skills.map((skill) => skill.slug)).toEqual(['appcli-cli', 'other']);
    // A package that does not declare the command gives nothing, and neither does a missing entry.
    expect(cliSkills(link, 'acme')).toEqual([]);
    expect(cliSkills(path.join(home, 'missing'), 'appcli')).toEqual([]);

    const placed = await placeSkills({
      paths: runnerPaths(path.join(home, 'runner')),
      appKey: 'app',
      workDir: home,
      skills: [],
      client: {} as ApiClient,
      builtIn: skills,
    });
    expect(placed.placement?.slugs).toEqual(['appcli-cli', 'other']);
    const file = path.join(placed.placement!.dir, 'appcli-cli', 'SKILL.md');
    expect(readFileSync(file, 'utf8')).toMatch(/^---\nname: appcli-cli\n/u);
    expect(
      existsSync(
        path.join(
          home,
          '.nocobase-runner',
          'plugin',
          '.claude-plugin',
          'plugin.json',
        ),
      ),
    ).toBe(true);
  });

  it('accepts a package whose single bin is named after it', () => {
    home = tempDir('runner-cli-skills-');
    const entry = cliPackage(
      path.join(home, 'pkg'),
      'appcli',
      { name: 'appcli', bin: './bin/run.js' },
      ['appcli-cli'],
    );
    expect(cliSkills(entry, 'appcli').map((skill) => skill.slug)).toEqual([
      'appcli-cli',
    ]);
  });
});
