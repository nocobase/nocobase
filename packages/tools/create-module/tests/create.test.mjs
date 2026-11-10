import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile, symlink } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fixture } from './fixture.mjs';
import { createModule, moduleName } from '../src/create.mjs';

const appRoot = path.resolve(
  import.meta.dirname,
  '../../../templates/app-template-default',
);

function run(cwd, executable, args) {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 8 * 1024 * 1024,
  });
  assert.equal(
    result.status,
    0,
    result.error?.message ?? result.stdout + result.stderr,
  );
  return result.stdout;
}

test('normalizes module names and rejects traversal, code injection and malformed scopes', () => {
  for (const name of [
    'samples',
    'app-module-samples',
    '@nocobase/app-module-samples',
  ])
    assert.equal(moduleName(name).packageName, '@nocobase/app-module-samples');
  assert.equal(
    moduleName('@acme/app-module-samples').packageName,
    '@acme/app-module-samples',
  );
  for (const name of [
    '../bad',
    "foo';bad",
    'Bad',
    '@bad scope/app-module-samples',
    '@other/unrelated-samples',
    'a'.repeat(41),
    '',
    'a--b',
  ])
    assert.throws(() => moduleName(name));
});

test('dry run reports the final files and leaves the App byte-for-byte unchanged', async (t) => {
  const root = await fixture(t);
  const before = await readFile(path.join(root, 'package.json'), 'utf8');
  const result = await createModule({
    name: 'quality-checks',
    directory: root,
    dryRun: true,
  });
  assert.equal(result.written, false);
  assert.ok(result.files.includes('client/layout.tsx'));
  assert.ok(
    !result.files.some(
      (f) => f.startsWith('database/main/migrations/') && f.endsWith('.ts'),
    ),
  );
  assert.equal(await readFile(path.join(root, 'package.json'), 'utf8'), before);
  assert.deepEqual((await readdir(path.join(root, 'packages'))).sort(), []);
});

for (const template of ['minimal', 'records'])
  test(`${template} generates a buildable module, registers through the CLI editor and refuses overwrite`, async (t) => {
    const root = await fixture(t);
    const result = await createModule({
      name: 'quality-checks',
      title: "Quality's checks",
      titleZh: '质量检查',
      directory: root,
      template,
      install: false,
    });
    const folder = result.targetDirectory;
    for (const name of result.files.filter((name) =>
      /\.[cm]?[jt]sx?$/.test(name),
    )) {
      const source = await readFile(path.join(folder, name), 'utf8');
      assert.doesNotMatch(
        source,
        /app-plugin-multi-module|defaultInstalled|seedModuleInstallation|@example\/module-records/,
      );
    }
    assert.equal(result.registered, false);
    const manifest = JSON.parse(
      await readFile(path.join(folder, 'package.json'), 'utf8'),
    );
    assert.equal(manifest.name, '@nocobase/app-module-quality-checks');
    assert.equal(
      manifest.peerDependencies['@nocobase/app-plugin-modules'],
      JSON.parse(
        await readFile(
          path.resolve(
            import.meta.dirname,
            '../../../plugins/app-plugin-modules/package.json',
          ),
          'utf8',
        ),
      ).version,
    );
    assert.equal(
      manifest.peerDependencies['@example/module-records'],
      undefined,
    );
    await symlink(
      path.join(root, 'node_modules'),
      path.join(folder, 'node_modules'),
    );
    // Run the real TypeScript compiler and shared lint against generated source, including both locale titles.
    run(folder, path.join(appRoot, 'node_modules/.bin/prettier'), [
      '.',
      '--write',
    ]);
    run(folder, path.join(appRoot, 'node_modules/.bin/tsc'), [
      '-p',
      'tsconfig.json',
    ]);
    run(
      folder,
      path.join(appRoot, 'node_modules/.bin/nocobase-db-manifests'),
      [],
    );
    const seedManifest = JSON.parse(
      await readFile(
        path.join(folder, 'dist/database/main/seeds/.manifest.json'),
        'utf8',
      ),
    );
    assert.deepEqual(Object.keys(seedManifest.files), []);
    assert.ok(
      result.files.every(
        (name) => !/^database\/(migrations|seeds)\//.test(name),
      ),
    );
    if (template === 'records') {
      const migrationManifest = JSON.parse(
        await readFile(
          path.join(folder, 'dist/database/main/migrations/.manifest.json'),
          'utf8',
        ),
      );
      assert.ok(
        Object.keys(migrationManifest.files).some((name) =>
          name.endsWith('_records.js'),
        ),
      );
    }
    run(folder, path.join(appRoot, 'node_modules/.bin/eslint'), [
      '.',
      '--max-warnings',
      '0',
    ]);
    const { planPluginRegistration, applyPluginRegistration } = await import(
      path.join(
        appRoot,
        'node_modules/@nocobase/app-cli/dist/lib/plugin-registration.js',
      )
    );
    const registration = await planPluginRegistration({
      appRoot: root,
      packageName: manifest.name,
      pluginDirectory: folder,
      dependencyRange: 'workspace:*',
    });
    assert.ok(registration.clientPluginsChanged);
    assert.ok(registration.serverPluginsChanged);
    await applyPluginRegistration(root, registration);
    assert.match(
      await readFile(path.join(root, 'client/plugins.ts'), 'utf8'),
      /qualityChecks\(\)/,
    );
    const before = await readFile(path.join(folder, 'module.ts'), 'utf8');
    await assert.rejects(
      createModule({ name: 'quality-checks', directory: root, install: false }),
      /already/,
    );
    assert.equal(
      await readFile(path.join(folder, 'module.ts'), 'utf8'),
      before,
    );
  });

test('unsupported templates and missing the open-source foundation fail before writes', async (t) => {
  const root = await fixture(t);
  await assert.rejects(
    createModule({ name: 'samples', directory: root, template: 'unknown' }),
    /Template/,
  );
  const manifestPath = path.join(root, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  delete manifest.dependencies['@nocobase/app-plugin-modules'];
  await writeFile(manifestPath, JSON.stringify(manifest));
  await assert.rejects(
    createModule({ name: 'samples', directory: root }),
    /Install and register/,
  );
  assert.deepEqual((await readdir(path.join(root, 'packages'))).sort(), []);
});

test('CLI compatibility covers registration, removal planning and package-owned Skills', async (t) => {
  const root = await fixture(t);
  const registration = await import(
    path.join(
      appRoot,
      'node_modules/@nocobase/app-cli/dist/lib/plugin-registration.js',
    )
  );
  const skills = await import(
    path.join(appRoot, 'node_modules/@nocobase/app-cli/dist/lib/skills-sync.js')
  );
  assert.equal(
    registration.pluginPackageName('scheduler'),
    '@nocobase/app-plugin-scheduler',
  );
  assert.equal(
    registration.pluginPackageName('@nocobase/app-module-samples'),
    '@nocobase/app-module-samples',
  );
  assert.equal(
    registration.pluginShortName('@nocobase/app-module-samples'),
    'samples',
  );
  assert.equal(
    skills.pluginSkillPrefix('@nocobase/app-module-samples'),
    'nocobase-app-module-samples',
  );
  const generated = await createModule({
    name: 'samples',
    directory: root,
    install: false,
  });
  const pkg = '@nocobase/app-module-samples';
  const skillRoot = path.join(
    generated.targetDirectory,
    'skills',
    'nocobase-app-module-samples',
  );
  await mkdir(skillRoot, { recursive: true });
  await writeFile(
    path.join(skillRoot, 'SKILL.md'),
    '---\nname: nocobase-app-module-samples\ndescription: Sample module operations\n---\nModule-specific guidance.\n',
  );
  const owned = await skills.collectPluginSkills({
    packageName: pkg,
    pluginDirectory: generated.targetDirectory,
  });
  assert.equal(owned.skills.length, 1);
  const added = await registration.planPluginRegistration({
    appRoot: root,
    packageName: pkg,
    pluginDirectory: generated.targetDirectory,
    dependencyRange: 'workspace:*',
  });
  await registration.applyPluginRegistration(root, added);
  const removal = await registration.planPluginUnregistration({
    appRoot: root,
    packageName: pkg,
  });
  await registration.applyPluginRegistration(root, removal);
  assert.doesNotMatch(
    await readFile(path.join(root, 'client/plugins.ts'), 'utf8'),
    /app-module-samples/,
  );
  assert.doesNotMatch(
    await readFile(path.join(root, 'server/plugins.ts'), 'utf8'),
    /app-module-samples/,
  );
  assert.ok(
    await readFile(path.join(generated.targetDirectory, 'module.ts'), 'utf8'),
  );
});
