/**
 * The online shell runs on a bundle of just-bash (`scripts/bundle-just-bash.mjs`), which the tests use too
 * (`vitest.config.ts`): the commands a run uses work from it, what it leaves out says so, and everything in it is under
 * a license the plugin may ship.
 */
import { builtinModules } from 'node:module';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  bundleJustBash,
  EXCLUDED_PACKAGES,
  type BundledPackage,
} from '../scripts/bundle-just-bash.mjs';
import {
  cliCommand,
  createSandbox,
  type OnlineSkill,
} from '../server/online/index.js';

const ALLOWED_LICENSES = new Set([
  'Apache-2.0',
  'MIT',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  '0BSD',
]);
/** What the bundle may grow to before someone looks at why. */
const MAX_BUNDLE_BYTES = 3 * 1024 * 1024;

describe('the just-bash bundle', () => {
  let outdir: string;
  let bundle: Awaited<ReturnType<typeof bundleJustBash>>;
  beforeAll(async () => {
    outdir = await mkdtemp(path.join(tmpdir(), 'agents-just-bash-'));
    bundle = await bundleJustBash({ outdir });
  });
  afterAll(async () => {
    await rm(outdir, { recursive: true, force: true });
  });

  it('contains only packages under an allowed license', () => {
    const refused = bundle.packages.filter(
      (item: BundledPackage) => !ALLOWED_LICENSES.has(item.license),
    );
    expect(refused.map((item) => `${item.name} (${item.license})`)).toEqual([]);
    expect(bundle.packages.map((item) => item.name)).toContain('just-bash');
  });

  it('lists every package it contains with its license', async () => {
    const text = await readFile(
      path.join(outdir, 'THIRD_PARTY_LICENSES.txt'),
      'utf8',
    );
    for (const item of bundle.packages)
      expect(text).toContain(`${item.name}@${item.version} — ${item.license}`);
    const justBash = bundle.packages.find((item) => item.name === 'just-bash');
    expect(justBash?.licenseText).toContain('Apache License');
  });

  it('leaves out the runtimes and native modules the shell does without', async () => {
    const names = new Set(bundle.packages.map((item) => item.name));
    for (const name of EXCLUDED_PACKAGES) expect(names).not.toContain(name);
    const source = await readFile(bundle.file, 'utf8');
    expect(source).not.toMatch(/cpython|quickjs|sql-wasm/iu);
    expect(
      bundle.imports.filter(
        (name) => !name.startsWith('node:') && !builtinModules.includes(name),
      ),
    ).toEqual([]);
  });

  it('stays small', () => {
    console.info(
      `just-bash bundle: ${(bundle.bytes / 1024).toFixed(0)} KB, ${bundle.packages.length} packages`,
    );
    expect(bundle.bytes).toBeLessThan(MAX_BUNDLE_BYTES);
  });
});

describe('the online shell on the bundle', () => {
  const skill: OnlineSkill = {
    slug: 'notes',
    hash: 'h',
    name: 'Notes',
    description: 'Notes.',
    markdown: '# Notes\n\nbeta\nalpha\nbeta\ngamma\n',
    files: [
      {
        path: 'docs/guide.md',
        size: 12,
        executable: false,
        text: 'one\ntwo\nthree\n',
      },
    ],
  };
  const run = async (command: string) => {
    const { bash } = createSandbox(
      [skill],
      [
        cliCommand({
          bin: 'acme',
          commands: [
            {
              id: 'issue:get',
              summary: 'Get an issue.',
              method: 'GET',
              path: '/app/api/issues/{issueId}',
              parameters: [],
              output: { kind: 'data' },
              identities: ['run'],
            },
          ],
          send: () => Promise.reject(new Error('offline')),
        }),
      ],
    );
    return bash.exec(command);
  };

  it.each([
    ['ls /skills/notes', 'SKILL.md\ndocs\n'],
    ['cat /skills/notes/docs/guide.md | wc -l', '3\n'],
    ['grep -c beta /skills/notes/SKILL.md', '2\n'],
    [
      'find /skills -name "*.md" -path "*docs*"',
      '/skills/notes/docs/guide.md\n',
    ],
    [
      'head -n 1 /skills/notes/docs/guide.md && tail -n 1 /skills/notes/docs/guide.md',
      'one\nthree\n',
    ],
    ['tail -n 4 /skills/notes/SKILL.md | sort | uniq', 'alpha\nbeta\ngamma\n'],
    ['sed -n 2p /skills/notes/docs/guide.md | sed s/two/2/', '2\n'],
    [
      'echo hello > /tmp/a.txt && echo more >> /tmp/a.txt && cat /tmp/a.txt',
      'hello\nmore\n',
    ],
    ['echo \'{"a":1}\' | jq .a', '1\n'],
  ])('runs %s', async (command, stdout) => {
    const result = await run(command);
    expect(result).toMatchObject({ exitCode: 0, stdout });
  });

  it('runs the application CLI', async () => {
    const result = await run('acme --help');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('issue get');
  });

  it.each([
    [
      'html-to-markdown /skills/notes/SKILL.md',
      'html-to-markdown: not available in this shell',
    ],
    [
      'echo x > /tmp/x && tar -cJf /tmp/x.tar.xz /tmp/x',
      'xz compression is not available in this shell',
    ],
    [
      'echo x > /tmp/x && tar --zstd -cf /tmp/x.tar.zst /tmp/x',
      'zstd compression is not available in this shell',
    ],
  ])('says %s is not available', async (command, stderr) => {
    const result = await run(command);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain(stderr);
  });
});
