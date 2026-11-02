import assert from 'node:assert/strict';
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  AGENT_SKILLS_DIRECTORIES,
  SKILLS_DIRECTORY,
  syncSkills,
} from '../../scripts/sync-skills.mjs';

const [AGENTS, CLAUDE] = AGENT_SKILLS_DIRECTORIES;

function everywhere(result) {
  return Object.fromEntries(
    AGENT_SKILLS_DIRECTORIES.map((directory) => [directory, result]),
  );
}

test('links every committed skill into both agent directories with a relative target', async (t) => {
  const root = await createRepository(t, ['nocobase-alpha', 'nocobase-beta']);

  assert.deepEqual(
    await syncSkills(root),
    everywhere({
      linked: ['nocobase-alpha', 'nocobase-beta'],
      removed: [],
      skipped: [],
    }),
  );
  for (const directory of AGENT_SKILLS_DIRECTORIES) {
    assert.equal(
      await readlink(path.join(root, directory, 'nocobase-alpha')),
      path.join('..', '..', SKILLS_DIRECTORY, 'nocobase-alpha'),
    );
    assert.equal(
      await readFile(
        path.join(root, directory, 'nocobase-beta', 'SKILL.md'),
        'utf8',
      ),
      '# nocobase-beta\n',
    );
  }
});

test('ignores files at the top of skills/', async (t) => {
  const root = await createRepository(t, ['nocobase-alpha']);
  await writeFile(path.join(root, SKILLS_DIRECTORY, 'README.md'), '# Skills\n');

  assert.deepEqual(
    await syncSkills(root),
    everywhere({ linked: ['nocobase-alpha'], removed: [], skipped: [] }),
  );
});

test('repeats without changing the result', async (t) => {
  const root = await createRepository(t, ['nocobase-alpha']);

  await syncSkills(root);
  assert.deepEqual(
    await syncSkills(root),
    everywhere({ linked: ['nocobase-alpha'], removed: [], skipped: [] }),
  );
});

test('removes a link whose skill is gone', async (t) => {
  const root = await createRepository(t, ['nocobase-alpha']);
  await syncSkills(root);
  await rm(path.join(root, SKILLS_DIRECTORY, 'nocobase-alpha'), {
    force: true,
    recursive: true,
  });

  assert.deepEqual(
    await syncSkills(root),
    everywhere({ linked: [], removed: ['nocobase-alpha'], skipped: [] }),
  );
  for (const directory of AGENT_SKILLS_DIRECTORIES) {
    await assert.rejects(lstat(path.join(root, directory, 'nocobase-alpha')), {
      code: 'ENOENT',
    });
  }
});

test('removes a link whose target is already missing', async (t) => {
  const root = await createRepository(t, []);
  await mkdir(path.join(root, CLAUDE), { recursive: true });
  await symlink(
    path.join('..', '..', SKILLS_DIRECTORY, 'nocobase-gone'),
    path.join(root, CLAUDE, 'nocobase-gone'),
    'dir',
  );

  assert.deepEqual(await syncSkills(root), {
    [AGENTS]: { linked: [], removed: [], skipped: [] },
    [CLAUDE]: { linked: [], removed: ['nocobase-gone'], skipped: [] },
  });
});

test('never replaces a real directory it did not write', async (t) => {
  const root = await createRepository(t, ['nocobase-alpha']);
  const occupied = path.join(root, AGENTS, 'nocobase-alpha');
  await mkdir(occupied, { recursive: true });
  await writeFile(path.join(occupied, 'SKILL.md'), 'local\n');

  assert.deepEqual(await syncSkills(root), {
    [AGENTS]: { linked: [], removed: [], skipped: ['nocobase-alpha'] },
    [CLAUDE]: { linked: ['nocobase-alpha'], removed: [], skipped: [] },
  });
  assert.equal(
    await readFile(path.join(occupied, 'SKILL.md'), 'utf8'),
    'local\n',
  );
});

test('leaves an unrelated local skill alone', async (t) => {
  const root = await createRepository(t, ['nocobase-alpha']);
  const local = path.join(root, CLAUDE, 'my-own-skill');
  await mkdir(local, { recursive: true });

  assert.deepEqual(
    await syncSkills(root),
    everywhere({ linked: ['nocobase-alpha'], removed: [], skipped: [] }),
  );
  assert.ok((await lstat(local)).isDirectory());
});

test('does nothing when the repository has no skills', async (t) => {
  const root = await createRepository(t, []);

  assert.deepEqual(
    await syncSkills(root),
    everywhere({ linked: [], removed: [], skipped: [] }),
  );
  for (const directory of AGENT_SKILLS_DIRECTORIES) {
    await assert.rejects(lstat(path.join(root, directory)), {
      code: 'ENOENT',
    });
  }
});

async function createRepository(t, skillNames) {
  const root = await mkdtemp(path.join(tmpdir(), 'sync-skills-'));
  t.after(() => rm(root, { force: true, recursive: true }));
  for (const name of skillNames) {
    const directory = path.join(root, SKILLS_DIRECTORY, name);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'SKILL.md'), `# ${name}\n`);
  }
  return root;
}

test('replaces old bridge links with the package Skill in both Agent directories', async (t) => {
  const name = 'nocobase-app-plugin-development';
  const root = await createRepository(t, [name]);
  const source = path.join('packages/app/app-skills/skills', name);
  await mkdir(path.join(root, source), { recursive: true });
  await writeFile(path.join(root, source, 'SKILL.md'), '# complete guidance\n');
  for (const directory of AGENT_SKILLS_DIRECTORIES) {
    await mkdir(path.join(root, directory), { recursive: true });
    await symlink(
      path.join('..', '..', SKILLS_DIRECTORY, name),
      path.join(root, directory, name),
      'dir',
    );
  }
  await syncSkills(root);
  for (const directory of AGENT_SKILLS_DIRECTORIES) {
    const link = path.join(root, directory, name);
    assert.equal(
      await readlink(link),
      path.relative(path.dirname(link), path.join(root, source)),
    );
    assert.equal(
      await readFile(path.join(link, 'SKILL.md'), 'utf8'),
      '# complete guidance\n',
    );
  }
  assert.equal(
    await readFile(path.join(root, SKILLS_DIRECTORY, name, 'SKILL.md'), 'utf8'),
    `# ${name}\n`,
  );
});

test('does not fall back to the bridge if the complete package Skill is missing', async (t) => {
  const name = 'nocobase-app-plugin-development';
  const root = await createRepository(t, [name]);
  await syncSkills(root);
  for (const directory of AGENT_SKILLS_DIRECTORIES) {
    await assert.rejects(lstat(path.join(root, directory, name)), {
      code: 'ENOENT',
    });
  }
});
