import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  appInstallerPackages,
  createAppPackages,
  filterArguments,
  formatOutputs,
  fullDirectories,
  fullFiles,
  pathDependencies,
  planFromChanges,
  planQualityScope,
  readDevDbPackages,
  readWorkspace,
} from '../../scripts/select-quality-scope.mjs';
import { EXEMPTIONS } from '../../scripts/check-cross-package-paths.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const script = path.join(root, 'scripts/select-quality-scope.mjs');
const workspace = readWorkspace(root);
const repository = {
  packages: workspace,
  devDbPackages: readDevDbPackages(root),
};
const plan = (...changedPaths) => planFromChanges(changedPaths, repository);

// A miniature workspace: `lib` <- `plugin` <- `app-template-default`, a leaf `other`, and `db` which dev/db imports.
function createRepository(t) {
  const cwd = mkdtempSync(path.join(os.tmpdir(), 'quality-scope-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  git('init', '--quiet');
  git('config', 'user.name', 'CI Test');
  git('config', 'user.email', 'ci-test@example.com');
  git('config', 'commit.gpgsign', 'false');
  git('config', 'core.hooksPath', '/dev/null');
  const write = (file, content = file) => {
    mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
    writeFileSync(path.join(cwd, file), content);
  };
  const manifest = (name, dependencies = {}) =>
    JSON.stringify({ name, version: '0.0.0', dependencies });
  write('pnpm-workspace.yaml', "packages:\n  - packages/*/*\n  - 'docs'\n");
  write('packages/libs/lib/package.json', manifest('@nocobase/lib'));
  write('packages/libs/db/package.json', manifest('@nocobase/db'));
  write(
    'packages/plugins/plugin/package.json',
    manifest('@nocobase/plugin', { '@nocobase/lib': 'workspace:^' }),
  );
  write('packages/plugins/other/package.json', manifest('@nocobase/other'));
  write(
    'packages/templates/app-template-default/package.json',
    manifest('@nocobase/app-template-default', {
      '@nocobase/plugin': 'workspace:^',
    }),
  );
  write('docs/package.json', manifest('@nocobase/docs'));
  write('dev/db/tests/a.test.ts', "import { x } from '@nocobase/db';\n");
  const commit = () => {
    git('add', '--all');
    git('commit', '--quiet', '--allow-empty', '-m', 'Fixture');
    return git('rev-parse', 'HEAD');
  };
  return { cwd, git, write, commit };
}

test('a push runs everything', (t) => {
  const repo = createRepository(t);
  const baseSha = repo.commit();
  repo.write('packages/plugins/other/index.ts');
  const headSha = repo.commit();
  const result = planQualityScope({
    cwd: repo.cwd,
    baseSha,
    headSha,
    eventName: 'push',
  });
  assert.equal(result.full, true);
  assert.equal(result.buildFull, true);
  assert.equal(result.runCreateApp, true);
  assert.equal(result.runAppInstaller, true);
  assert.equal(result.runDbChecks, true);
  assert.deepEqual(result.packages, [
    '@nocobase/app-template-default',
    '@nocobase/db',
    '@nocobase/docs',
    '@nocobase/lib',
    '@nocobase/other',
    '@nocobase/plugin',
  ]);
});

test('a missing or unavailable comparison runs everything', (t) => {
  const repo = createRepository(t);
  const headSha = repo.commit();
  for (const baseSha of [undefined, '', '0'.repeat(40), 'f'.repeat(40)]) {
    const result = planQualityScope({
      cwd: repo.cwd,
      baseSha,
      headSha,
      eventName: 'pull_request',
    });
    assert.equal(result.full, true, String(baseSha));
  }
  assert.equal(
    planQualityScope({
      cwd: repo.cwd,
      baseSha: headSha,
      eventName: 'pull_request',
    }).full,
    true,
  );
});

test('a failing diff fails the plan instead of narrowing the run', (t) => {
  const repo = createRepository(t);
  const headSha = repo.commit();
  assert.throws(
    () =>
      planQualityScope({
        cwd: repo.cwd,
        baseSha: headSha,
        headSha,
        eventName: 'pull_request',
        git: (args) => {
          if (args[0] === 'diff') throw new Error('diff exploded');
          return `${headSha}\n`;
        },
      }),
    /diff exploded/u,
  );
});

test('a pull request selects the changed packages and their dependents from git', (t) => {
  const repo = createRepository(t);
  const baseSha = repo.commit();
  repo.write('packages/libs/lib/src/index.ts');
  repo.write('.changeset/some-change.md');
  const headSha = repo.commit();
  const result = planQualityScope({
    cwd: repo.cwd,
    baseSha,
    headSha,
    eventName: 'pull_request',
  });
  assert.equal(result.full, false);
  assert.deepEqual(result.changedPackages, ['@nocobase/lib']);
  assert.deepEqual(result.packages, [
    '@nocobase/app-template-default',
    '@nocobase/lib',
    '@nocobase/plugin',
  ]);
  assert.equal(result.runCreateApp, true);
  assert.equal(result.runAppInstaller, true);
  assert.equal(result.buildFull, true);
  assert.equal(result.runDbChecks, false);
});

test('git selection covers deletions and both sides of a rename', (t) => {
  const repo = createRepository(t);
  repo.write('packages/plugins/other/move-out.ts');
  repo.write('packages/libs/db/delete.ts');
  const baseSha = repo.commit();
  repo.git('mv', 'packages/plugins/other/move-out.ts', 'docs/moved-out.ts');
  repo.git('rm', '--quiet', 'packages/libs/db/delete.ts');
  const headSha = repo.commit();
  const result = planQualityScope({
    cwd: repo.cwd,
    baseSha,
    headSha,
    eventName: 'pull_request',
  });
  assert.deepEqual(result.packages, [
    '@nocobase/db',
    '@nocobase/docs',
    '@nocobase/other',
  ]);
  assert.equal(result.runDbChecks, true);
  assert.deepEqual(result.packPackages, ['@nocobase/db', '@nocobase/other']);
});

test('the CLI writes its outputs and falls back to everything for a push', (t) => {
  const repo = createRepository(t);
  const baseSha = repo.commit();
  repo.write('packages/plugins/other/index.ts');
  const headSha = repo.commit();
  const output = path.join(repo.cwd, 'github-output');
  const run = (eventName) => {
    writeFileSync(output, '');
    execFileSync(process.execPath, [script], {
      cwd: repo.cwd,
      env: {
        ...process.env,
        BASE_SHA: baseSha,
        HEAD_SHA: headSha,
        EVENT_NAME: eventName,
        GITHUB_OUTPUT: output,
        GITHUB_STEP_SUMMARY: '',
      },
    });
    return Object.fromEntries(
      readFileSync(output, 'utf8')
        .trim()
        .split('\n')
        .map((line) => line.split(/=(.*)/su).slice(0, 2)),
    );
  };
  assert.deepEqual(run('pull_request'), {
    full: 'false',
    packages: '["@nocobase/other"]',
    package_count: '1',
    filter: '--filter=@nocobase/other',
    run_db_checks: 'false',
    run_build: 'true',
    build_full: 'false',
    pack_packages: '["@nocobase/other"]',
    run_create_app: 'false',
    run_app_installer: 'false',
  });
  const full = run('push');
  assert.equal(full.full, 'true');
  assert.equal(full.filter, '');
  assert.equal(full.build_full, 'true');
});

test('global paths run everything', () => {
  for (const file of [
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    '.npmrc',
    '.pnpmfile.cjs',
    'eslint.config.js',
    'lint-staged.config.mjs',
    'patches/knex.patch',
    'packages/tools/dev-config/src/vitest/node.ts',
    'scripts/pack-check.mjs',
    'scripts/select-quality-scope.mjs',
    'tests/scripts/select-quality-scope.test.mjs',
    '.github/actions/verify-create-app/action.yml',
    'dev/db/tests/examples/command.test.ts',
  ]) {
    const result = plan(
      'packages/plugins/app-plugin-knowledge/README.md',
      file,
    );
    assert.equal(result.full, true, file);
    assert.equal(result.buildFull, true, file);
    assert.equal(result.runDbChecks, true, file);
    assert.equal(result.packages.length, workspace.size, file);
  }
});

test('a plugin without dependents selects only itself', (t) => {
  const repo = createRepository(t);
  const result = planFromChanges(
    ['packages/plugins/other/server/index.ts', '.changeset/other.md'],
    {
      packages: readWorkspace(repo.cwd),
      devDbPackages: readDevDbPackages(repo.cwd),
    },
  );
  assert.equal(result.full, false);
  assert.deepEqual(result.packages, ['@nocobase/other']);
  assert.deepEqual(result.packPackages, ['@nocobase/other']);
  assert.equal(result.runBuild, true);
  assert.equal(result.buildFull, false);
  assert.equal(result.runCreateApp, false);
  assert.equal(result.runAppInstaller, false);
  assert.equal(result.runDbChecks, false);
});

test('a library many packages depend on selects its dependents and the generated-application smoke tests', () => {
  const result = plan('packages/libs/i18n/src/index.ts');
  assert.equal(result.full, false);
  assert.deepEqual(result.changedPackages, ['@nocobase/i18n']);
  for (const name of [
    '@nocobase/i18n',
    '@nocobase/app-server',
    '@nocobase/app-client',
    '@nocobase/app-template-default',
    '@nocobase/app-template-examples',
  ]) {
    assert.ok(result.packages.includes(name), name);
  }
  assert.ok(result.packages.length > 20);
  assert.ok(result.packages.length < workspace.size);
  assert.equal(result.runCreateApp, true);
  assert.equal(result.runAppInstaller, true);
  assert.equal(result.buildFull, true);
  assert.deepEqual(result.packPackages, []);
});

test('a template change selects the template, its path consumers and the smoke tests it needs', () => {
  const examples = plan('packages/templates/app-template-examples/README.MD');
  assert.deepEqual(examples.packages, [
    '@nocobase/app-template-examples',
    '@nocobase/ui-library',
  ]);
  assert.equal(examples.runCreateApp, true);
  assert.equal(examples.runAppInstaller, false);
  assert.equal(examples.buildFull, true);

  const defaults = plan('packages/templates/app-template-default/README.MD');
  assert.equal(defaults.runCreateApp, true);
  assert.equal(defaults.runAppInstaller, true);

  const installer = plan('packages/tools/app-installer/src/cli.ts');
  assert.deepEqual(installer.packages, ['@nocobase/app-installer']);
  assert.equal(installer.runCreateApp, false);
  assert.equal(installer.runAppInstaller, true);
  assert.equal(installer.buildFull, true);

  const createApp = plan('packages/tools/create-app/src/index.ts');
  assert.equal(createApp.runCreateApp, true);
  assert.equal(createApp.runAppInstaller, false);
});

for (const template of ['app-template-default', 'app-template-examples']) {
  for (const file of ['vitest.config.ts', 'tests/setup/client-config.ts']) {
    test(`${template}'s ${file} selects the installed-client regression`, () => {
      const result = plan(`packages/templates/${template}/${file}`);
      assert.equal(result.full, false);
      assert.ok(result.packages.includes('@nocobase/app-testing'));
      const otherTemplate =
        template === 'app-template-default'
          ? '@nocobase/app-template-examples'
          : '@nocobase/app-template-default';
      assert.ok(!result.packages.includes(otherTemplate));
    });
  }
}

test('paths read without a declared dependency select their consumers but not the consumers’ dependents', () => {
  const ui = plan(
    'packages/plugins/app-plugin-agents/client/components/ui/button.tsx',
  );
  assert.ok(ui.packages.includes('@nocobase/app-plugin-agents'));
  assert.ok(!ui.packages.includes('@nocobase/app-plugin-notification'));
  assert.ok(!ui.packages.includes('@nocobase/app-plugin-file'));
  assert.deepEqual(ui.changedPackages, ['@nocobase/app-plugin-agents']);

  const agents = plan('packages/plugins/app-plugin-agents/server/index.ts');
  assert.ok(!agents.packages.includes('@nocobase/app-plugin-notification'));

  const template = plan(
    'packages/templates/app-template-default/client/components/ui/button.tsx',
  );
  for (const name of [
    '@nocobase/app-template-default',
    '@nocobase/app-plugin-file',
  ]) {
    assert.ok(template.packages.includes(name), name);
  }
});

test('reads declared as dependencies select their readers through the workspace graph', () => {
  // app-cli's tests read create-plugin, app-client and service-provider; app-server's no longer read a template.
  for (const file of [
    'packages/tools/create-plugin/src/lib/scaffold.ts',
    'packages/app/app-client/src/index.ts',
    'packages/libs/service-provider/src/index.ts',
  ]) {
    assert.ok(plan(file).packages.includes('@nocobase/app-cli'), file);
  }
  assert.ok(
    plan('packages/libs/service-provider/src/index.ts').packages.includes(
      '@nocobase/db-testkit',
    ),
  );
  // The UI Library website imports the default template's stylesheet.
  assert.ok(
    plan(
      'packages/templates/app-template-default/client/styles.css',
    ).packages.includes('@nocobase/ui-library'),
  );
  // app-cli no longer reads the scheduler plugin by path.
  assert.ok(
    !plan('packages/plugins/app-plugin-scheduler/README.md').packages.includes(
      '@nocobase/app-cli',
    ),
  );
});

test('a change outside every package selects nothing and skips building', () => {
  for (const changed of [
    ['.changeset/some-change.md'],
    ['.changeset/a.md', 'AGENTS.md', '.agents/rules/testing.md', 'README.md'],
    ['skills/README.md', 'packages/README.md'],
  ]) {
    const result = plan(...changed);
    assert.equal(result.full, false, changed.join());
    assert.deepEqual(result.packages, [], changed.join());
    assert.equal(result.runBuild, false);
    assert.equal(result.runDbChecks, false);
    assert.equal(result.runCreateApp, false);
    assert.equal(result.runAppInstaller, false);
    assert.equal(
      formatOutputs(result)
        .split('\n')
        .find((line) => line.startsWith('filter=')),
      'filter=',
    );
  }
});

test('a file in a directory that is no longer a workspace package runs everything', () => {
  assert.equal(
    plan('packages/plugins/app-plugin-gone/src/index.ts').full,
    true,
  );
});

test('a database package selects the root dev/db checks', () => {
  assert.equal(plan('packages/libs/db-sqlite/src/index.ts').runDbChecks, true);
  assert.equal(plan('packages/libs/db/src/index.ts').runDbChecks, true);
  assert.equal(plan('packages/libs/i18n/src/index.ts').runDbChecks, false);
  assert.ok(repository.devDbPackages.has('@nocobase/db'));
});

test('the workspace is read without installing dependencies', () => {
  const directories = [...workspace.values()].map(({ directory }) => directory);
  assert.ok(directories.includes('packages/libs/i18n'));
  assert.ok(directories.includes('ui-library'));
  assert.ok(directories.includes('docs'));
  assert.ok(
    workspace.get('@nocobase/app-plugin-knowledge').dependencies.size > 0,
  );
});

test('every path dependency names a path and consumers that still exist', () => {
  const exempted = new Set(EXEMPTIONS.map((entry) => entry.packageName));
  for (const { path: guarded, consumers } of pathDependencies) {
    const absolute = path.join(root, guarded);
    assert.ok(existsSync(absolute), `${guarded} no longer exists`);
    assert.equal(
      statSync(absolute).isDirectory(),
      guarded.endsWith('/'),
      `${guarded} must end with / exactly when it is a directory`,
    );
    for (const consumer of consumers) {
      assert.ok(workspace.has(consumer), `${consumer} is not a package`);
      // A read that could be declared belongs in the manifest, not here; only an exempted one needs a mapping.
      assert.ok(
        exempted.has(consumer),
        `${consumer} has no EXEMPTIONS entry in scripts/check-cross-package-paths.mjs`,
      );
    }
  }
  for (const name of [...createAppPackages, ...appInstallerPackages]) {
    assert.ok(workspace.has(name), `${name} is not a package`);
  }
  for (const directory of fullDirectories) {
    assert.ok(directory.endsWith('/'), directory);
  }
  for (const file of [
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'eslint.config.js',
    'lint-staged.config.mjs',
  ]) {
    assert.ok(fullFiles.has(file) && existsSync(path.join(root, file)), file);
  }
});

test('pnpm filter arguments accept package names only', () => {
  assert.equal(
    filterArguments(['@nocobase/a', 'b']),
    '--filter=@nocobase/a --filter=b',
  );
  assert.equal(filterArguments([]), '');
  assert.throws(
    () => filterArguments(['@nocobase/a; rm -rf /']),
    /Unexpected/u,
  );
});
