// A skill's binary files arrive base64-encoded and are written as bytes; executable ones keep the executable bit, in
// the cache and in the run's skills folder.
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import type { SkillBundle } from '../src/protocol/index.ts';
import { runnerPaths } from '../src/lib/home.ts';
import type { ApiClient } from '../src/lib/http.ts';
import { placeSkills } from '../src/agent/skills.ts';
import { removeDir, tempDir } from './helpers.ts';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 1, 2, 0xff]);

describe('skill files', () => {
  let home: string;
  afterEach(() => removeDir(home));

  it('writes binary files as bytes and scripts as executable', async () => {
    home = tempDir('acme-skill-files-');
    const bundle: SkillBundle = {
      slug: 'brand',
      version: '2',
      hash: 'h1',
      files: [
        { path: 'SKILL.md', content: '---\nname: brand\n---\n' },
        {
          path: 'assets/logo.png',
          content: PNG.toString('base64'),
          encoding: 'base64',
        },
        { path: 'scripts/check.sh', content: 'echo ok\n', executable: true },
      ],
    };
    const client = {
      server: 'http://acme.test',
      get: () => Promise.resolve(bundle),
    } as unknown as ApiClient;
    const placed = await placeSkills({
      paths: runnerPaths(home),
      appKey: 'app',
      workDir: home,
      skills: [
        {
          slug: 'brand',
          name: 'Brand',
          version: '2',
          hash: 'h1',
          description: 'Our logo.',
          bundleUrl: '/api/agents/runners/runs/r1/skills/brand',
        },
      ],
      client,
    });
    const dir = path.join(placed.placement!.dir, 'brand');
    expect(readFileSync(path.join(dir, 'assets/logo.png'))).toEqual(PNG);
    expect(statSync(path.join(dir, 'scripts/check.sh')).mode & 0o111).not.toBe(
      0,
    );
    expect(statSync(path.join(dir, 'SKILL.md')).mode & 0o111).toBe(0);
  });
});
