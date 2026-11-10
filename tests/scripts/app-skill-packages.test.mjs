import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const directory = path.join(root, 'packages/skills');
const packageDirectories = (await readdir(directory, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map((entry) => {
      const file = path.join(directory, entry.name);
      return entry.isDirectory() ? filesIn(file) : [file];
    }),
  );
  return groups.flat();
}

test('the requested public guides are independently discoverable packages', () => {
  assert.deepEqual(
    packageDirectories.sort(),
    [
      'approval',
      'caching-redis',
      'concurrency-redis',
      'jobs-redis',
      'queue-redis',
      'realtime-redis',
      'task-center',
    ].map((name) => `app-skill-${name}`),
  );
});

for (const packageDirectory of packageDirectories) {
  test(`${packageDirectory} publishes self-contained documentation without commercial dependencies`, async () => {
    const packageRoot = path.join(directory, packageDirectory);
    const manifest = JSON.parse(
      await readFile(path.join(packageRoot, 'package.json'), 'utf8'),
    );
    assert.equal(manifest.name, `@nocobase/${packageDirectory}`);
    assert.equal(manifest.publishConfig.access, 'public');
    assert.deepEqual(manifest.files, ['skills']);
    for (const section of [
      'dependencies',
      'optionalDependencies',
      'peerDependencies',
    ])
      assert.deepEqual(Object.keys(manifest[section] ?? {}), []);
    const prefix = `nocobase-app-plugin-${packageDirectory.slice('app-skill-'.length)}`;
    assert.equal(
      manifest.nocobase.skill.plugin,
      `@nocobase/${prefix.slice('nocobase-'.length)}`,
    );
    assert.match(manifest.nocobase.skill.sourceRevision, /^[0-9a-f]{40}$/u);
    assert.ok(manifest.nocobase.skill.pluginVersion);
    const skillRoot = path.join(packageRoot, 'skills', prefix);
    const entry = await readFile(path.join(skillRoot, 'SKILL.md'), 'utf8');
    assert.match(
      entry,
      new RegExp(`^---\\nname: ${prefix}\\ndescription: .+\\n---`, 'u'),
    );
    assert.ok(
      (await stat(path.join(skillRoot, 'references/installation.md'))).isFile(),
    );
    for (const file of await filesIn(skillRoot)) {
      assert.equal(
        path.extname(file),
        '.md',
        'Public guides must not include runtime implementation files',
      );
      const text = await readFile(file, 'utf8');
      for (const [, link] of text.matchAll(
        /\]\(([^\s)]+)(?:\s+"[^"]*")?\)/gu,
      )) {
        if (/^(?:[a-z][a-z\d+.-]*:|#)/iu.test(link)) continue;
        const target = path.resolve(
          path.dirname(file),
          decodeURIComponent(link.split('#')[0]),
        );
        assert.ok(
          target === skillRoot || target.startsWith(skillRoot + path.sep),
          `${file}: reference escapes the Skill: ${link}`,
        );
        assert.ok(
          (await stat(target)).isFile(),
          `${file}: missing reference ${link}`,
        );
      }
    }
  });
}
