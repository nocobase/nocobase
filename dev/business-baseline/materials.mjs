import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, scenarios } from './evaluate.mjs';

const directory = fileURLToPath(new URL('.', import.meta.url));
const root = path.resolve(directory, '../..');
const base = '4c89e3cdd540965552834837313f47d4e0af8795';
const command = process.argv[2];
assert(
  ['seal', 'check', 'archive'].includes(command) && process.argv.length === 3,
  'Usage: node dev/business-baseline/materials.mjs <seal|check|archive>',
);
const git = (args) =>
  execFileSync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
const resourcePaths = git(['ls-tree', '-r', '--name-only', base])
  .toString()
  .trim()
  .split('\n')
  .filter(
    (file) =>
      [
        'package.json',
        'pnpm-lock.yaml',
        'pnpm-workspace.yaml',
        'scripts/sync-app-skill-examples.mjs',
      ].includes(file) ||
      file.startsWith('packages/templates/app-template-default/') ||
      file.startsWith('packages/templates/app-template-examples/') ||
      file.startsWith('packages/app/app-skills/') ||
      (file.startsWith('packages/') &&
        (file.includes('/skills/') ||
          /^packages\/[^/]+\/[^/]+\/package\.json$/.test(file))),
  );

async function filesUnder(dir, prefix = '') {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory())
      result.push(
        ...(await filesUnder(path.join(dir, entry.name), relative + '/')),
      );
    else result.push(relative);
  }
  return result.sort();
}

async function validateScenarios() {
  const index = JSON.parse(
    await readFile(path.join(directory, 'scenario-index.json')),
  );
  assert.equal(index.length, scenarios.length);
  for (const scenario of scenarios) {
    const prompt = await readFile(
      path.join(directory, 'prompts', `${scenario}.txt`),
      'utf8',
    );
    const suite = JSON.parse(
      await readFile(path.join(directory, 'assertions', `${scenario}.json`)),
    );
    const seed = JSON.parse(
      await readFile(path.join(directory, 'seeds', `${scenario}.json`)),
    );
    assert(prompt.length > 500 && suite.cases.length > 0);
    assert.equal(suite.scenario, scenario);
    assert.equal(seed.scenario, scenario);
    assert.equal(
      new Set(suite.cases.map((item) => item.id)).size,
      suite.cases.length,
    );
    for (const item of suite.cases) {
      assert(
        item.steps.length > 0 &&
          ['business', 'permission', 'consistency'].includes(item.category),
      );
      assert(
        item.steps.every(
          (step) => step.action && Object.keys(step.expect).length,
        ),
      );
    }
    assert(
      ['business', 'permission', 'consistency'].every((category) =>
        suite.cases.some((item) => item.category === category),
      ),
    );
    assert(suite.cases.some((item) => item.channel === 'browser'));
    assert(suite.cases.some((item) => item.channel === 'database'));
    const entry = index.find((item) => item.id === scenario);
    assert(
      entry &&
        entry.status === (scenario === 'expenses' ? 'held-out' : 'planned'),
    );
    assert(
      [
        'title',
        'sources',
        'destination',
        'entries',
        'dependencies',
        'commands',
        'applicability',
        'replacementPoints',
        'limitations',
      ].every((key) => key in entry),
    );
    assert.equal(entry.sources.length === 0, scenario === 'expenses');
  }
}

await validateScenarios();
if (command === 'seal') {
  assert(
    !(await stat(path.join(directory, 'materials.json')).catch(() => null)),
    'Materials already sealed; do not silently change the evaluation contract',
  );
  const resources = {};
  for (const file of resourcePaths)
    resources[file] = digest(git(['show', `${base}:${file}`]));
  await writeFile(
    path.join(directory, 'resources.json'),
    JSON.stringify(
      { sourceCommit: base, algorithm: 'sha256', files: resources },
      null,
      2,
    ) + '\n',
  );
  const materials = {};
  for (const file of await filesUnder(directory))
    if (file !== 'materials.json')
      materials[file] = digest(await readFile(path.join(directory, file)));
  await writeFile(
    path.join(directory, 'materials.json'),
    JSON.stringify(
      { version: 1, algorithm: 'sha256', files: materials },
      null,
      2,
    ) + '\n',
  );
  console.log(
    `Sealed ${Object.keys(materials).length} materials and ${resourcePaths.length} original resources.`,
  );
} else {
  const materials = JSON.parse(
    await readFile(path.join(directory, 'materials.json')),
  );
  assert.deepEqual(
    (await filesUnder(directory)).filter((file) => file !== 'materials.json'),
    Object.keys(materials.files).sort(),
    'Unexpected or missing collection material',
  );
  for (const [file, hash] of Object.entries(materials.files))
    assert.equal(
      digest(await readFile(path.join(directory, file))),
      hash,
      `Changed collection material: ${file}`,
    );
  const resources = JSON.parse(
    await readFile(path.join(directory, 'resources.json')),
  );
  assert.equal(resources.sourceCommit, base);
  assert.deepEqual(Object.keys(resources.files), resourcePaths);
  for (const [file, hash] of Object.entries(resources.files))
    assert.equal(
      digest(git(['show', `${base}:${file}`])),
      hash,
      `Changed original resource: ${file}`,
    );
  if (command === 'archive') {
    const output = path.join(
      root,
      '.business-baseline',
      'original-resources.tar',
    );
    await mkdir(path.dirname(output), { recursive: true });
    assert(
      !(await stat(output).catch(() => null)),
      'Archive already exists; preserve the original',
    );
    const archivePaths = [
      ...new Set(
        resourcePaths.map((file) =>
          file.includes('/skills/')
            ? file.slice(0, file.indexOf('/skills/') + 7)
            : file,
        ),
      ),
    ];
    const archive = git([
      'archive',
      '--format=tar',
      base,
      '--',
      ...archivePaths,
    ]);
    await writeFile(output, archive);
    await writeFile(
      output + '.sha256',
      digest(archive) + '  original-resources.tar\n',
    );
    console.log(`Archived original resources: ${output}`);
  } else
    console.log(
      `Verified ${Object.keys(materials.files).length} materials and ${resourcePaths.length} original resources.`,
    );
}
