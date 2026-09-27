import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  parseArgs,
  assertWorkdir,
  formatShellEnv,
  registryEnv,
  registryEnvOverrides,
} from '../../scripts/unreleased.mjs';
import {
  mergeMainConfig,
  readMainConfig,
} from '../../scripts/smoke-database-config.mjs';

test('unreleased arguments select templates and reject incomplete database configuration', () => {
  assert.equal(parseArgs(['smoke']).template, 'default');
  assert.equal(parseArgs(['smoke', '--template', 'hub']).template, 'hub');
  assert.equal(parseArgs(['prepare', '--port', '4874']).port, 4874);
  assert.equal(
    parseArgs(['smoke', '--dialect', 'postgres', '--config', '/tmp/test.yml'])
      .dialect,
    'postgres',
  );
  for (const args of [
    ['smoke', '--template', 'bad'],
    ['smoke', '--dialect', 'postgres'],
    ['prepare', '--port', '65536'],
    ['smoke', '--timeout', '0'],
    ['clean', '--port', '4873'],
    ['env', '--port', '4873'],
  ])
    assert.throws(() => parseArgs(args));
  assert.equal(parseArgs(['env']).action, 'env');
});

test('shell env exports exactly what registryEnv sets and unsets inherited configuration', () => {
  const state = {
    repo: '/work/nocobase',
    registry: 'http://127.0.0.1:4873/',
    npmrc: "/tmp/it's a session/npmrc",
  };
  const output = formatShellEnv(state, {
    npm_config_ignore_scripts: 'true',
    npm_config_registry: 'https://registry.example/',
    PATH: '/usr/bin',
  });
  // npm_config_registry is overridden, so only the other inherited setting needs removing.
  assert.match(output, /^unset npm_config_ignore_scripts$/m);
  assert.doesNotMatch(output, /^unset .*npm_config_registry/m);

  const script = `${output}\nnode -e 'process.stdout.write(JSON.stringify(process.env))'`;
  const result = spawnSync('sh', ['-c', script], {
    env: { PATH: process.env.PATH, npm_config_ignore_scripts: 'true' },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const evaluated = JSON.parse(result.stdout);
  for (const [key, value] of Object.entries(registryEnvOverrides(state)))
    assert.equal(evaluated[key], value, key);
  assert.equal(evaluated.npm_config_ignore_scripts, undefined);
});

test('shell env overrides a scoped registry saved with pnpm config set', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'unreleased-shell-'));
  try {
    const registry = 'http://127.0.0.1:4873/';
    const npmrc = path.join(root, 'session', 'npmrc');
    fs.mkdirSync(path.dirname(npmrc));
    fs.writeFileSync(
      npmrc,
      `registry=${registry}\n@nocobase:registry=${registry}\n`,
    );
    // Where `pnpm config set @nocobase:registry …` writes, which PNPM_CONFIG_USERCONFIG does not replace.
    const userConfig = path.join(root, 'user-config');
    fs.mkdirSync(path.join(userConfig, 'pnpm'), { recursive: true });
    fs.writeFileSync(
      path.join(userConfig, 'pnpm', 'auth.ini'),
      '@nocobase:registry=https://published.invalid/\n',
    );
    const env = { ...process.env, XDG_CONFIG_HOME: userConfig };
    const resolve = (prefix) =>
      spawnSync('sh', ['-c', `${prefix}\npnpm config get @nocobase:registry`], {
        env,
        encoding: 'utf8',
      });

    const withUserConfigOnly = resolve(
      `export PNPM_CONFIG_USERCONFIG='${npmrc}'`,
    );
    assert.equal(withUserConfigOnly.status, 0, withUserConfigOnly.stderr);
    assert.equal(
      withUserConfigOnly.stdout.trim(),
      'https://published.invalid/',
      'the fixture must reproduce the leak for this test to mean anything',
    );

    const withShellEnv = resolve(
      formatShellEnv({ repo: root, registry, npmrc }, env),
    );
    assert.equal(withShellEnv.status, 0, withShellEnv.stderr);
    assert.equal(withShellEnv.stdout.trim(), registry);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('registry environment overrides npm and pnpm without changing the process environment', () => {
  const original = process.env.NPM_CONFIG_REGISTRY;
  const env = registryEnv({
    registry: 'http://127.0.0.1:4873/',
    npmrc: '/tmp/local.npmrc',
  });
  assert.equal(env.NPM_CONFIG_REGISTRY, env.PNPM_CONFIG_REGISTRY);
  assert.equal(env.NPM_CONFIG_USERCONFIG, '/tmp/local.npmrc');
  assert.equal(process.env.NPM_CONFIG_REGISTRY, original);
});

test('workdir validation refuses existing files and repository descendants', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'unreleased-test-'));
  try {
    const repo = path.join(root, 'repo');
    fs.mkdirSync(repo);
    assert.throws(() => assertWorkdir(repo, repo), /outside/);
    const work = assertWorkdir(path.join(root, 'work'), repo);
    fs.writeFileSync(path.join(work, 'keep'), 'important');
    assert.throws(() => assertWorkdir(work, repo), /empty/);
    assert.equal(fs.readFileSync(path.join(work, 'keep'), 'utf8'), 'important');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('database config merge preserves generated secrets and other connections', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'unreleased-config-'));
  try {
    const source = path.join(root, 'source.yml');
    const target = path.join(root, 'config.yml');
    fs.writeFileSync(
      source,
      'auth:\n  secret: ignored\ndatabase:\n  connections:\n    main:\n      dialect: postgres\n      host: test-db\n      password: test-password\n',
    );
    fs.writeFileSync(
      target,
      'auth:\n  secret: generated-secret\ndatabase:\n  connections:\n    main:\n      dialect: postgres\n      migrations:\n        autoRun: true\n    analytics:\n      dialect: sqlite\n',
    );
    assert.throws(() => readMainConfig(source, 'mysql'), /selected dialect/);
    mergeMainConfig(target, source, 'postgres');
    const result = fs.readFileSync(target, 'utf8');
    assert.match(result, /generated-secret/);
    assert.doesNotMatch(result, /ignored/);
    assert.match(result, /test-db/);
    assert.match(result, /analytics/);
    assert.match(result, /autoRun: true/);
    assert.equal(fs.statSync(target).mode & 0o777, 0o600);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('npm and pnpm resolve the isolated scope registry instead of user configuration', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'unreleased-env-'));
  try {
    const npmrc = path.join(root, 'npmrc');
    const registry = 'http://127.0.0.1:4873/';
    fs.writeFileSync(
      npmrc,
      `registry=${registry}\n@nocobase:registry=${registry}\n`,
    );
    const env = registryEnv({ npmrc, registry });
    for (const tool of ['npm', 'pnpm']) {
      for (const key of ['registry', '@nocobase:registry']) {
        const result = spawnSync(tool, ['config', 'get', key], {
          env,
          encoding: 'utf8',
        });
        assert.equal(result.status, 0, result.stderr);
        assert.equal(result.stdout.trim(), registry);
      }
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('create accepts a name and creation options without requiring database credentials', () => {
  const options = parseArgs([
    'create',
    'crm',
    '--template',
    'hub',
    '--dialect',
    'postgres',
    '--json',
    '--no-install',
    '--output-dir',
    '/tmp/apps',
  ]);
  assert.equal(options.name, 'crm');
  assert.equal(options.template, 'hub');
  assert.equal(options.dialect, 'postgres');
  assert.equal(options.json, true);
  assert.equal(options['no-install'], true);
  assert.equal(options['output-dir'], '/tmp/apps');
  for (const args of [
    ['create'],
    ['create', '../crm'],
    ['create', 'crm', 'other'],
    ['create', 'crm', '--registry', 'http://example.com'],
  ])
    assert.throws(() => parseArgs(args));
});

test('installer-smoke takes a source, its own ports and a workdir, not the registry port', () => {
  const options = parseArgs(['installer-smoke']);
  assert.equal(options['hub-port'], 13200);
  assert.equal(options['app-port'], 13100);
  assert.equal(options.source, undefined);
  assert.equal(
    parseArgs(['installer-smoke', '--source', 'archive']).source,
    'archive',
  );
  assert.equal(
    parseArgs([
      'installer-smoke',
      '--hub-port',
      '13300',
      '--workdir',
      '/tmp/hub',
    ])['hub-port'],
    13300,
  );
  for (const args of [
    ['installer-smoke', '--port', '4874'],
    ['installer-smoke', '--hub-port', '70000'],
    ['installer-smoke', '--hub-port', '13010'],
    ['installer-smoke', '--template', 'hub'],
    ['installer-smoke', '--source', 'docker'],
    ['installer-smoke', '--app-port', '13200'],
    ['smoke', '--hub-port', '13300'],
  ])
    assert.throws(() => parseArgs(args));
});

test('reset is a boolean option exclusive to prepare', () => {
  assert.equal(parseArgs(['prepare']).reset, undefined);
  assert.equal(parseArgs(['prepare', '--reset', '--port', '4874']).reset, true);
  assert.equal(parseArgs(['prepare', '--port', '4874', '--reset']).port, 4874);
  for (const args of [
    ['clean', '--reset'],
    ['smoke', '--reset'],
    ['create', 'crm', '--reset'],
    ['prepare', '--reset', 'false'],
  ])
    assert.throws(() => parseArgs(args), /Invalid option/);
});

for (const scenario of [
  'existing',
  'reset',
  'fresh',
  'foreign',
  'remove-fails',
  'locked',
  'legacy',
]) {
  test(`prepare reset lifecycle: ${scenario}`, () => {
    const root = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'unreleased-reset-')),
    );
    const repo = path.join(root, 'repo');
    fs.mkdirSync(path.join(repo, 'scripts'), { recursive: true });
    // Use a separate checkout identity so tests cannot touch a developer's session.
    const script = fs
      .readFileSync(
        new URL('../../scripts/unreleased.mjs', import.meta.url),
        'utf8',
      )
      .replace(
        "'./smoke-registry-config.mjs'",
        JSON.stringify(
          new URL('../../scripts/smoke-registry-config.mjs', import.meta.url)
            .href,
        ),
      )
      .replace(
        "'./smoke-database-config.mjs'",
        JSON.stringify(
          new URL('../../scripts/smoke-database-config.mjs', import.meta.url)
            .href,
        ),
      )
      .replace(
        "'./smoke-app-installer.mjs'",
        JSON.stringify(
          new URL('../../scripts/smoke-app-installer.mjs', import.meta.url)
            .href,
        ),
      );
    fs.writeFileSync(path.join(repo, 'scripts/unreleased.mjs'), script);
    const id = createHash('sha256').update(repo).digest('hex').slice(0, 12);
    const stateDir = path.join(os.tmpdir(), `nocobase-unreleased-${id}`);
    const stateFile = path.join(stateDir, 'state.json');
    const container = `nocobase-unreleased-${id}`;
    const legacyStateDir = path.join(
      os.tmpdir(),
      `nocobase-local-registry-${id}`,
    );
    const legacyContainer = `nocobase-local-registry-${id}`;
    fs.mkdirSync(stateDir, { recursive: true });
    const state = {
      repo,
      container,
      registry: 'http://127.0.0.1:4873/',
      ready: true,
    };
    if (scenario !== 'fresh' && scenario !== 'legacy')
      fs.writeFileSync(stateFile, JSON.stringify(state));
    if (scenario === 'legacy') {
      fs.mkdirSync(legacyStateDir, { recursive: true });
      fs.writeFileSync(
        path.join(legacyStateDir, 'state.json'),
        JSON.stringify({ ...state, container: legacyContainer }),
      );
    }
    fs.writeFileSync(path.join(stateDir, 'old-cache'), 'old snapshot');
    if (scenario === 'locked')
      fs.writeFileSync(path.join(stateDir, 'lock'), String(process.pid));
    fs.mkdirSync(path.join(repo, 'packages/libs/fixture'), { recursive: true });
    fs.writeFileSync(
      path.join(repo, 'packages/libs/fixture/package.json'),
      JSON.stringify({ name: '@test/fixture', version: '1.0.0' }),
    );
    fs.mkdirSync(path.join(repo, '.github/verdaccio'), { recursive: true });
    fs.writeFileSync(
      path.join(repo, '.github/verdaccio/config.yaml'),
      'packages:\n',
    );
    const log = path.join(root, 'docker.jsonl');
    fs.writeFileSync(
      path.join(root, 'docker'),
      `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ args, locked: fs.existsSync(${JSON.stringify(path.join(stateDir, 'lock'))}) }) + '\\n');
if (args[0] === 'ps') console.log(${JSON.stringify(scenario === 'legacy' ? legacyContainer : container)});
if (args[0] === 'inspect') console.log(${JSON.stringify(scenario === 'foreign' ? 'another-checkout' : id)});
if (args[0] === 'rm' && ${JSON.stringify(scenario)} === 'remove-fails') process.exit(1);
// End the fixture at startup; no real Docker daemon, build, or publish is used.
if (args[0] === 'run') process.exit(23);
`,
      { mode: 0o755 },
    );
    try {
      const result = spawnSync(
        process.execPath,
        [
          path.join(repo, 'scripts/unreleased.mjs'),
          'prepare',
          ...(scenario === 'existing' ? [] : ['--reset']),
          '--port',
          '4874',
        ],
        {
          encoding: 'utf8',
          env: {
            ...process.env,
            PATH: `${root}${path.delimiter}${process.env.PATH}`,
          },
        },
      );
      assert.equal(result.status, 1, result.stderr);
      const calls = fs.existsSync(log)
        ? fs
            .readFileSync(log, 'utf8')
            .trim()
            .split('\n')
            .map((line) => JSON.parse(line))
        : [];
      const commands = calls.map(({ args }) => args[0]);
      assert.ok(
        calls.every(({ locked }) => locked),
        'cleanup and startup must retain the operation lock',
      );
      if (['reset', 'fresh', 'legacy'].includes(scenario)) {
        assert.deepEqual(
          commands,
          scenario === 'fresh' ? ['run'] : ['ps', 'inspect', 'rm', 'run'],
        );
        if (scenario === 'legacy') {
          assert.deepEqual(calls[2].args, ['rm', '-f', '-v', legacyContainer]);
          assert.equal(fs.existsSync(legacyStateDir), false);
        }
        assert.match(result.stderr, /docker run failed.*23/);
        assert.equal(fs.existsSync(path.join(stateDir, 'old-cache')), false);
        assert.equal(
          JSON.parse(fs.readFileSync(stateFile, 'utf8')).registry,
          'http://127.0.0.1:4874/',
        );
      } else {
        assert.deepEqual(
          commands,
          scenario === 'foreign'
            ? ['ps', 'inspect']
            : scenario === 'remove-fails'
              ? ['ps', 'inspect', 'rm']
              : [],
        );
        assert.deepEqual(JSON.parse(fs.readFileSync(stateFile, 'utf8')), state);
        assert.equal(
          fs.readFileSync(path.join(stateDir, 'old-cache'), 'utf8'),
          'old snapshot',
        );
        assert.match(
          result.stderr,
          scenario === 'existing'
            ? /session already exists/
            : scenario === 'foreign'
              ? /not owned/
              : scenario === 'locked'
                ? /operation is running/
                : /docker rm failed/,
        );
      }
      assert.equal(
        fs.existsSync(path.join(stateDir, 'lock')),
        scenario === 'locked',
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(stateDir, { recursive: true, force: true });
      fs.rmSync(legacyStateDir, { recursive: true, force: true });
    }
  });
}
