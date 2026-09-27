import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  APP_HOST_PORT,
  SOURCES,
  runArchiveSmoke,
  runTemplateSmoke,
} from './smoke-app-installer.mjs';
import { isolateWorkspacePackages } from './smoke-registry-config.mjs';
import { dialects, readMainConfig } from './smoke-database-config.mjs';

const repo = path.resolve(import.meta.dirname, '..');
const id = createHash('sha256').update(repo).digest('hex').slice(0, 12);
const stateDir = path.join(os.tmpdir(), `nocobase-unreleased-${id}`);
const stateFile = path.join(stateDir, 'state.json');
const container = `nocobase-unreleased-${id}`;
const label = 'nocobase.unreleased';
// Sessions prepared while these commands were named local-registry:*. Clean removes one so that a fresh session can
// take the port it still holds.
const legacyStateDir = path.join(os.tmpdir(), `nocobase-local-registry-${id}`);
const legacyContainer = `nocobase-local-registry-${id}`;
const legacyLabel = 'nocobase.local-registry';
const help = `Test the unreleased checkout as published packages

pnpm unreleased:prepare [--port 4873] [--reset]
pnpm unreleased:create NAME [--template default|examples|hub] [--dialect sqlite]
  # --dialect only decides which configuration commands are printed afterwards
  [--output-dir /parent/directory] [--json] [--no-install]
pnpm unreleased:smoke [--template default|examples|hub] [--dialect sqlite]
  [--config /absolute/test.yml] [--timeout 420] [--workdir /empty/directory]
pnpm unreleased:installer-smoke [--source archive|template] [--hub-port 13200]
  [--app-port 13100] [--workdir /empty/directory]
pnpm unreleased:clean
eval "$(pnpm -s unreleased:env)"

Prepare builds and publishes all workspace packages to a fresh local npm registry.
Env prints the variables create and smoke run with, as shell exports, so plain
pnpm and npm commands in the current shell — and an agent started from it — resolve
the snapshot too, instead of the registry in your own pnpm and npm configuration.
Use --reset to remove the previous session and clear its snapshot before preparing again.
Smoke runs test/dev/build/start and retains applications and logs outside the repository.
Installer-smoke runs the snapshot's app-installer against both of its sources, or the one
--source names: it creates a default application, builds its deployment archive, installs,
upgrades and rolls it back; and it installs a Hub from its template, then upgrades and rolls
it back. It needs pm2 on PATH and, for the Hub, the App Host port 13010 free; it runs pm2
with its own PM2_HOME, stops it afterwards, and retains the installations and their logs
outside the repository.
A non-SQLite smoke test requires --config pointing to a dedicated test database;
application migrations and seeds may modify it. Clean removes the registry and its
caches, not test applications.
`;

export function parseArgs(argv) {
  const [action, ...args] = argv;
  if (
    !['prepare', 'create', 'smoke', 'installer-smoke', 'env', 'clean'].includes(
      action,
    )
  )
    throw new Error(
      'Expected prepare, create, smoke, installer-smoke, env, or clean.',
    );
  const options = {
    action,
    port: 4873,
    'hub-port': 13200,
    'app-port': 13100,
    template: 'default',
    dialect: 'sqlite',
    timeout: 420,
  };
  const allowed = {
    prepare: ['port'],
    smoke: ['template', 'dialect', 'config', 'timeout', 'workdir'],
    'installer-smoke': ['source', 'hub-port', 'app-port', 'workdir'],
    create: ['template', 'dialect', 'output-dir'],
    env: [],
    clean: [],
  };
  for (let i = 0; i < args.length; i++) {
    if (action === 'prepare' && args[i] === '--reset') {
      options.reset = true;
      continue;
    }
    if (action === 'create' && ['--json', '--no-install'].includes(args[i])) {
      options[args[i].slice(2)] = true;
      continue;
    }
    if (action === 'create' && !args[i].startsWith('-')) {
      if (options.name)
        throw new Error('Only one application name is allowed.');
      options.name = args[i];
      continue;
    }
    const key = args[i].replace(/^--/, '');
    if (
      !args[i].startsWith('--') ||
      !allowed[action].includes(key) ||
      !args[i + 1] ||
      args[i + 1].startsWith('--')
    )
      throw new Error(`Invalid option: ${args[i]}`);
    options[key] = args[++i];
  }
  if (action === 'create' && !/^[a-z0-9][a-z0-9._-]*$/.test(options.name ?? ''))
    throw new Error(
      'Provide an application name using lowercase letters, digits, dots, dashes or underscores.',
    );
  for (const key of ['port', 'hub-port', 'app-port', 'timeout']) {
    options[key] = Number(options[key]);
    if (
      !Number.isInteger(options[key]) ||
      options[key] < 1 ||
      (key !== 'timeout' && options[key] > 65535)
    )
      throw new Error(`Invalid ${key}.`);
  }
  if (options['hub-port'] === APP_HOST_PORT)
    throw new Error(
      `--hub-port ${APP_HOST_PORT} is where the Hub's App Host listens; choose another port.`,
    );
  if (options.source !== undefined && !SOURCES.includes(options.source))
    throw new Error('--source takes archive or template.');
  if (options['app-port'] === options['hub-port'])
    throw new Error('--app-port and --hub-port must differ.');
  if (!['default', 'examples', 'hub'].includes(options.template))
    throw new Error('Unknown template.');
  if (!dialects.includes(options.dialect)) throw new Error('Unknown dialect.');
  if (action === 'smoke' && options.dialect !== 'sqlite' && !options.config)
    throw new Error(
      'A non-SQLite smoke test requires --config for a dedicated test database.',
    );
  return options;
}

function run(
  command,
  args,
  { cwd = repo, env = process.env, capture = false } = {},
) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  if (result.error || result.status !== 0)
    throw new Error(
      `${command} ${args[0] ?? ''} failed${result.error ? `: ${result.error.message}` : ` (exit ${result.status})`}.`,
    );
  return result.stdout?.trim();
}

const INHERITED_CONFIG = /^(npm_config_|pnpm_config_)/i;

export function registryEnv(state) {
  const env = { ...process.env };
  // Ignore inherited registry/auth/cache overrides; use a session-only npmrc for both tools.
  for (const key of Object.keys(env))
    if (INHERITED_CONFIG.test(key)) delete env[key];
  return { ...env, ...registryEnvOverrides(state) };
}

/**
 * What `registryEnv` sets on top of the inherited environment.
 *
 * `XDG_CONFIG_HOME` is the one that is easy to leave out and the one that matters most. `pnpm config set` writes a
 * scoped registry to the global `auth.ini` in pnpm's configuration directory (`~/Library/Preferences/pnpm` on macOS,
 * `$XDG_CONFIG_HOME/pnpm` elsewhere), and that file is read however `PNPM_CONFIG_USERCONFIG` is set. Anyone who
 * followed the documented `pnpm config set @nocobase:registry …` has one, so without a session configuration
 * directory every `@nocobase/*` package still resolves against the published registry — and because a snapshot
 * carries the same version numbers as the last release, nothing reports that it did. pnpm reads no other variable for
 * that directory, so moving it means moving `XDG_CONFIG_HOME` as a whole.
 */
export function registryEnvOverrides(state) {
  const sessionDir = path.dirname(state.npmrc);
  return {
    NPM_CONFIG_USERCONFIG: state.npmrc,
    PNPM_CONFIG_USERCONFIG: state.npmrc,
    PNPM_CONFIG_NPMRC_AUTH_FILE: state.npmrc,
    XDG_CONFIG_HOME: path.join(sessionDir, 'config'),
    PNPM_CONFIG_REGISTRY: state.registry,
    npm_config_registry: state.registry,
    NPM_CONFIG_REGISTRY: state.registry,
    NOCOBASE_REGISTRY: state.registry,
    NODE_AUTH_TOKEN: '',
    PNPM_CONFIG_MINIMUM_RELEASE_AGE: '0',
    PNPM_CONFIG_CACHE_DIR: path.join(sessionDir, 'cache'),
    PNPM_CONFIG_STORE_DIR: path.join(sessionDir, 'store'),
    NPM_CONFIG_CACHE: path.join(sessionDir, 'npm-cache'),
  };
}

/**
 * `registryEnv` as commands a POSIX shell can evaluate, so that plain `pnpm` and `npm` in an interactive shell — and
 * an agent started from it — resolve exactly as `create` and `smoke` do. `inherited` is the environment this process
 * received, which is the calling shell's plus whatever pnpm adds to run the script: the configuration variables
 * `registryEnv` drops are unset, which is harmless for the ones only pnpm set.
 */
export function formatShellEnv(state, inherited = process.env) {
  const overrides = registryEnvOverrides(state);
  const unset = Object.keys(inherited)
    .filter((key) => INHERITED_CONFIG.test(key) && !(key in overrides))
    .sort();
  return [
    `# Unreleased packages from ${state.repo} at ${state.registry}`,
    '# XDG_CONFIG_HOME moves for this shell too, so tools that keep their settings there (gh, for one) will not find',
    '# them here. Open a new shell to leave the session.',
    ...(unset.length ? [`unset ${unset.join(' ')}`] : []),
    ...Object.entries(overrides).map(
      ([key, value]) => `export ${key}=${shellQuote(value)}`,
    ),
  ].join('\n');
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'\\''`)}'`;
}

async function assertRegistryAvailable(state) {
  try {
    const response = await fetch(`${state.registry}-/ping`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error('Registry is unavailable.');
  } catch {
    throw new Error(
      'The local npm registry is unavailable. Run pnpm unreleased:clean and pnpm unreleased:prepare.',
    );
  }
}

function assertRegistries(state, env, cwd = repo) {
  for (const tool of ['npm', 'pnpm'])
    for (const key of ['registry', '@nocobase:registry']) {
      const actual = run(tool, ['config', 'get', key], {
        env,
        capture: true,
        cwd,
      })
        .split('\n')
        .at(-1)
        .replace(/\/$/, '');
      if (actual !== state.registry.replace(/\/$/, ''))
        throw new Error(
          `${tool} ${key} does not point to the local npm registry; refusing to publish or install.`,
        );
    }
}

function readState() {
  if (!fs.existsSync(stateFile))
    throw new Error('Run pnpm unreleased:prepare first.');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  if (
    state.repo !== repo ||
    state.container !== container ||
    !/^http:\/\/127\.0\.0\.1:\d+\/$/.test(state.registry)
  )
    throw new Error('Invalid unreleased session state.');
  return state;
}

export function assertWorkdir(directory, root = repo) {
  const resolved = path.resolve(directory);
  fs.mkdirSync(resolved, { recursive: true });
  const real = fs.realpathSync(resolved);
  const relative = path.relative(fs.realpathSync(root), real);
  if (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== '..' &&
      !path.isAbsolute(relative))
  )
    throw new Error('The test directory must be outside the repository.');
  if (fs.readdirSync(real).length)
    throw new Error('The test directory must be empty.');
  return real;
}

async function prepare(options) {
  if (
    fs.existsSync(stateFile) ||
    fs.existsSync(path.join(legacyStateDir, 'state.json'))
  )
    throw new Error(
      'An unreleased session already exists. Run pnpm unreleased:prepare --reset to prepare a fresh snapshot.',
    );
  const packages = fs
    .globSync('packages/*/*/package.json', { cwd: repo })
    .map((file) => JSON.parse(fs.readFileSync(path.join(repo, file), 'utf8')))
    .filter((pkg) => !pkg.private);
  const state = {
    repo,
    container,
    registry: `http://127.0.0.1:${options.port}/`,
    npmrc: path.join(stateDir, 'npmrc'),
    ready: false,
    versions: Object.fromEntries(
      packages.map((pkg) => [pkg.name, pkg.version]),
    ),
  };
  for (const pkg of packages) {
    if (
      pkg.publishConfig?.registry &&
      pkg.publishConfig.registry.replace(/\/$/, '') !==
        state.registry.replace(/\/$/, '')
    )
      throw new Error(
        `${pkg.name} publishConfig.registry points outside the local npm registry.`,
      );
  }
  fs.writeFileSync(stateFile, JSON.stringify(state), { mode: 0o600 });
  const config = path.join(stateDir, 'verdaccio.yaml');
  fs.writeFileSync(
    config,
    isolateWorkspacePackages(
      fs.readFileSync(path.join(repo, '.github/verdaccio/config.yaml'), 'utf8'),
      packages,
    ),
  );
  run('docker', [
    'run',
    '-d',
    '--name',
    container,
    '--label',
    `${label}=${id}`,
    '-p',
    `127.0.0.1:${options.port}:4873`,
    '-v',
    `${config}:/verdaccio/conf/config.yaml:ro`,
    'verdaccio/verdaccio:5',
  ]);
  let available = false;
  for (let i = 0; i < 60; i++) {
    try {
      if (
        (
          await fetch(`${state.registry}-/ping`, {
            signal: AbortSignal.timeout(1000),
          })
        ).ok
      ) {
        available = true;
        break;
      }
    } catch {
      /* Startup may take a few seconds. */
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!available)
    throw new Error(
      `Registry did not start. Inspect docker logs ${container}.`,
    );
  const response = await fetch(
    `${state.registry}-/user/org.couchdb.user:local-test`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'local-test',
        password: 'local-test',
        type: 'user',
        roles: [],
      }),
      signal: AbortSignal.timeout(10000),
    },
  );
  const { token } = await response.json();
  if (!response.ok || !token)
    throw new Error('Local npm registry authentication failed.');
  fs.writeFileSync(
    state.npmrc,
    `registry=${state.registry}\n@nocobase:registry=${state.registry}\n//127.0.0.1:${options.port}/:_authToken=${token}\n`,
    { mode: 0o600 },
  );
  // Build with normal dependency resolution before using the empty isolated registry.
  console.log('Building publishable workspace packages...');
  run('pnpm', ['-r', '--filter', '!@nocobase/docs', '--if-present', 'build'], {
    env: { ...process.env, NOCOBASE_SKIP_WORKSPACE_DEPENDENCY_BUILD: '1' },
  });
  const env = registryEnv(state);
  assertRegistries(state, env);
  console.log('Publishing the checkout to the isolated local npm registry...');
  run('pnpm', ['changeset', 'publish', '--no-git-tag'], { env });
  // The repository is in prerelease mode. Explicitly expose this snapshot as latest for manual pnpm create.
  for (const pkg of packages)
    run(
      'npm',
      [
        'dist-tag',
        'add',
        `${pkg.name}@${pkg.version}`,
        'latest',
        '--registry',
        state.registry,
      ],
      { env, capture: true },
    );
  state.ready = true;
  fs.writeFileSync(stateFile, JSON.stringify(state), { mode: 0o600 });
  const wrapper = path.join(stateDir, 'create.mjs');
  fs.writeFileSync(
    wrapper,
    `import { createManually } from ${JSON.stringify(new URL(import.meta.url).href)};
try { createManually(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; }
`,
    { mode: 0o600 },
  );
  console.log(`Ready: ${state.registry}
For manual development: pnpm unreleased:create my-app
For an automated check: pnpm unreleased:smoke --template default
For the installer: pnpm unreleased:installer-smoke
For manual testing, run outside the repository:
  node ${JSON.stringify(wrapper)} my-app --json
The wrapper runs pnpm create with isolated configuration and snapshot versions.
To make plain pnpm and npm in a shell resolve the snapshot, for example to test an agent Skill:
  eval "$(pnpm -s unreleased:env)"
Clean up with: pnpm unreleased:clean`);
}

export function createManually(args, cwd = process.cwd()) {
  const state = readState();
  if (!state.ready) throw new Error('Preparation did not complete.');
  const relative = path.relative(repo, fs.realpathSync(cwd));
  if (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
  )
    throw new Error('Run manual creation outside the repository.');
  let template = 'default';
  const forwarded = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--registry' || args[i].startsWith('--registry='))
      throw new Error('The local wrapper owns the registry setting.');
    if (args[i] === '--template') template = args[++i];
    else if (args[i].startsWith('--template='))
      template = args[i].slice('--template='.length);
    else forwarded.push(args[i]);
  }
  if (!['default', 'examples', 'hub'].includes(template))
    throw new Error('Unknown template.');
  const env = registryEnv(state);
  assertRegistries(state, env, cwd);
  run(
    'pnpm',
    [
      'create',
      `@nocobase/app@${state.versions['@nocobase/create-app']}`,
      ...forwarded,
      '--registry',
      state.registry,
      '--template',
      `@nocobase/app-template-${template}@${state.versions[`@nocobase/app-template-${template}`]}`,
    ],
    { env, cwd },
  );
}

function removeOwnedContainer(name, labelKey) {
  const names = run(
    'docker',
    ['ps', '-a', '--filter', `name=^/${name}$`, '--format', '{{.Names}}'],
    { capture: true },
  );
  if (!names) return;
  const owner = run(
    'docker',
    ['inspect', '--format', `{{index .Config.Labels "${labelKey}"}}`, name],
    { capture: true },
  );
  if (owner !== id)
    throw new Error(
      'Refusing to remove a container not owned by this checkout.',
    );
  run('docker', ['rm', '-f', '-v', name]);
}

function clean() {
  if (fs.existsSync(stateFile))
    removeOwnedContainer(readState().container, label);
  if (fs.existsSync(path.join(legacyStateDir, 'state.json'))) {
    removeOwnedContainer(legacyContainer, legacyLabel);
    fs.rmSync(legacyStateDir, { recursive: true, force: true });
  }
  // Keep the operation lock in place throughout reset and preparation.
  for (const entry of fs.readdirSync(stateDir)) {
    if (entry !== 'lock')
      fs.rmSync(path.join(stateDir, entry), { recursive: true, force: true });
  }
  console.log(
    'Local npm registry and isolated caches removed. Test applications and logs retained.',
  );
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(help);
    return;
  }
  const options = parseArgs(process.argv.slice(2));
  fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  const lock = path.join(stateDir, 'lock');
  if (fs.existsSync(lock)) {
    const pid = Number(fs.readFileSync(lock, 'utf8'));
    let alive = false;
    try {
      process.kill(pid, 0);
      alive = true;
    } catch {
      /* A previous operation was interrupted. */
    }
    if (alive) throw new Error('Another unreleased operation is running.');
    fs.unlinkSync(lock);
  }
  fs.writeFileSync(lock, String(process.pid), { flag: 'wx' });
  try {
    if (options.action === 'prepare') {
      if (options.reset) clean();
      await prepare(options);
    } else if (options.action === 'create') {
      const state = readState();
      if (!state.ready) throw new Error('Run pnpm unreleased:prepare first.');
      await assertRegistryAvailable(state);
      const parent = path.resolve(
        options['output-dir'] ?? path.join(repo, '..', 'nocobase-local-apps'),
      );
      const target = assertWorkdir(path.join(parent, options.name));
      createManually(
        [
          options.name,
          '--template',
          options.template,
          ...(options.json ? ['--json'] : []),
          ...(options['no-install'] ? ['--no-install'] : []),
        ],
        fs.realpathSync(parent),
      );
      if (!options.json) {
        // Creation stops at a configurable project. `--dialect` is not passed through — it decides which driver the
        // application depends on, which is a change to the application rather than to how it is scaffolded.
        const configure =
          options.dialect === 'sqlite'
            ? ['pnpm nocobase config init']
            : [
                `pnpm add @nocobase/db-${options.dialect}`,
                `pnpm nocobase config init --dialect ${options.dialect}`,
              ];
        console.log(
          [
            `Application: ${target}`,
            `Next: cd ${JSON.stringify(target)}`,
            ...(options['no-install'] ? ['  pnpm install'] : []),
            ...configure.map((command) => `  ${command}`),
          ].join('\n'),
        );
      }
    } else if (options.action === 'smoke') {
      const state = readState();
      if (!state.ready)
        throw new Error(
          'Preparation did not complete. Run pnpm unreleased:prepare --reset.',
        );
      if (options.config)
        readMainConfig(path.resolve(options.config), options.dialect);
      const directory = assertWorkdir(
        options.workdir ??
          fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-unreleased-smoke-')),
      );
      const env = registryEnv(state);
      assertRegistries(state, env);
      console.log(`Test application and logs: ${directory}`);
      run(
        'bash',
        [
          path.join(repo, 'scripts/smoke-create-app.sh'),
          '--registry',
          state.registry,
          '--create-app-version',
          state.versions['@nocobase/create-app'],
          '--template',
          `@nocobase/app-template-${options.template}@${state.versions[`@nocobase/app-template-${options.template}`]}`,
          '--dialect',
          options.dialect,
          '--json',
          '--workdir',
          directory,
          '--timeout',
          String(options.timeout),
          ...(options.config ? ['--config', path.resolve(options.config)] : []),
        ],
        { env },
      );
    } else if (options.action === 'installer-smoke') {
      const state = readState();
      if (!state.ready)
        throw new Error(
          'Preparation did not complete. Run pnpm unreleased:prepare --reset.',
        );
      await assertRegistryAvailable(state);
      const installer = state.versions['@nocobase/app-installer'];
      if (!installer)
        throw new Error(
          'This snapshot has no @nocobase/app-installer. Run pnpm unreleased:prepare --reset from a checkout that has it.',
        );
      if (spawnSync('pm2', ['--version'], { stdio: 'ignore' }).status !== 0)
        throw new Error('pm2 is required on PATH: npm install -g pm2');
      const directory = assertWorkdir(
        options.workdir ??
          fs.mkdtempSync(
            path.join(os.tmpdir(), 'nocobase-unreleased-installer-'),
          ),
      );
      // pm2 keeps its sockets in PM2_HOME, and a Unix socket path has to stay under about 104 bytes, which the macOS
      // temporary directory already comes close to. A short directory under /tmp keeps this run off your own pm2.
      const pm2Home = fs.mkdtempSync('/tmp/nb-pm2-');
      const env = { ...registryEnv(state), PM2_HOME: pm2Home };
      assertRegistries(state, env);
      const command = ['npx', '--yes', `@nocobase/app-installer@${installer}`];
      const sources = options.source ? [options.source] : SOURCES;
      console.log(`Installations and logs: ${directory}`);
      try {
        if (sources.includes('archive')) {
          // A default application from the snapshot, built for this machine: what a user deploys without a Hub.
          createManually(
            ['app', '--template', 'default', '--json'],
            fs.realpathSync(directory),
          );
          const project = path.join(directory, 'app');
          run('pnpm', ['build', '--tar'], { cwd: project, env });
          runArchiveSmoke({
            root: path.join(directory, 'crm'),
            port: options['app-port'],
            archive: path.join(project, 'storage/exports/dist.tar.gz'),
            installer: command,
            env,
          });
          console.log('Archive smoke test passed.');
        }
        if (sources.includes('template')) {
          runTemplateSmoke({
            root: path.join(directory, 'hub'),
            port: options['hub-port'],
            installer: command,
            env,
          });
          console.log('Hub template smoke test passed.');
        }
        console.log(
          `Installer smoke test passed. Installations and logs retained: ${directory}`,
        );
      } finally {
        spawnSync('pm2', ['kill'], { env, stdio: 'ignore' });
        fs.rmSync(pm2Home, { recursive: true, force: true });
      }
    } else if (options.action === 'env') {
      const state = readState();
      if (!state.ready) throw new Error('Run pnpm unreleased:prepare first.');
      await assertRegistryAvailable(state);
      // stdout carries only what the shell evaluates; everything meant for a person is a comment.
      console.log(formatShellEnv(state));
    } else {
      clean();
    }
  } finally {
    fs.rmSync(lock, { force: true });
  }
}

if (import.meta.main)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
