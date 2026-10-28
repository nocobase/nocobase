import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import {
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scenarios } from './evaluate.mjs';
import { checkSyncedSkills, verifyRuntime } from './runtime.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const base = '4c89e3cdd540965552834837313f47d4e0af8795';
const source = 'packages/templates/app-template-default';
const [command, scenario, requestedRound] = process.argv.slice(2);
assert(
  ['prepare', 'config', 'start', 'reset', 'bind'].includes(command) &&
    [...scenarios, 'smoke'].includes(scenario) &&
    (command === 'bind'
      ? process.argv.length === 5
      : [4, 5].includes(process.argv.length)) &&
    (requestedRound === undefined ||
      ['before', 'after'].includes(requestedRound)),
  'Usage: node dev/business-baseline/instance.mjs <prepare|config|start|reset|bind> <scenario|smoke> [before|after]',
);
const round = requestedRound ?? 'before';
const target = path.join(
  root,
  '.business-baseline',
  round === 'after' ? `after-${scenario}` : scenario,
);
const marker = path.join(target, '.baseline-instance.json');
const port = scenario === 'smoke' ? 14759 : 14752 + scenarios.indexOf(scenario);
const env = {
  ...process.env,
  TZ: 'UTC',
  APP_SERVER_HOST: '127.0.0.1',
  APP_SERVER_PORT: String(port),
  APP_BASE_PATH: `/baseline-${scenario}`,
  APP_PUBLIC_ORIGIN: `http://127.0.0.1:${port}`,
  DB_DIALECT: 'sqlite',
  DB_FILENAME: path.join(target, 'storage/database.sqlite'),
  APP_SAMPLE_DATA: 'false',
  NOCOBASE_STRICT_STARTUP: 'true',
};
// Host process settings must not redirect an isolated baseline into another backend/configuration.
for (const name of [
  'PROXY_TARGET_URL',
  'APP_CONFIG_FILE',
  'DB_HOST',
  'DB_PORT',
  'DB_DATABASE',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_SSL',
  'INITIAL_ADMIN_USERNAME',
  'INITIAL_ADMIN_EMAIL',
  'INITIAL_ADMIN_PASSWORD',
])
  delete env[name];

function pnpm(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', args, { cwd: target, env, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) =>
      code === 0
        ? resolve()
        : reject(new Error(`pnpm exited ${code ?? signal}`)),
    );
  });
}

async function bindEnvironment(round) {
  const runtime = await verifyRuntime(target, round);
  const styleFile = path.join(target, 'client/styles.css');
  const original = execFileSync(
    'git',
    ['show', `${base}:${source}/client/styles.css`],
    { cwd: root, encoding: 'utf8' },
  );
  const bounded = original.replace(
    "@import 'tailwindcss';",
    "@import 'tailwindcss' source(none);\n@source './';",
  );
  const current = await readFile(styleFile, 'utf8');
  assert(
    current === original || current === bounded,
    'Only bind a clean preparation instance',
  );
  await writeFile(styleFile, bounded);
  return { runtime, environment: 'bounded-tailwind-client-v1' };
}

if (command === 'prepare') {
  assert(
    !(await stat(target).catch(() => null)),
    'Instance already exists; preserve scored source and evidence',
  );
  await mkdir(target, { recursive: true });
  const files = execFileSync(
    'git',
    ['ls-tree', '-r', '--name-only', base, '--', source],
    { cwd: root, encoding: 'utf8' },
  )
    .trim()
    .split('\n');
  for (const file of files) {
    const relative = file.slice(source.length + 1);
    const destination = path.join(target, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(
      destination,
      execFileSync('git', ['show', `${base}:${file}`], {
        cwd: root,
        maxBuffer: 16 * 1024 * 1024,
      }),
    );
  }
  // Own the cache directory; symlinking node_modules itself shares Vite's mutable cache.
  const dependencies = path.join(root, source, 'node_modules');
  const localDependencies = path.join(target, 'node_modules');
  await mkdir(localDependencies);
  for (const entry of await readdir(dependencies)) {
    if (entry.startsWith('.vite')) continue;
    await symlink(
      path.join(dependencies, entry),
      path.join(localDependencies, entry),
    );
  }
  await writeFile(
    marker,
    JSON.stringify(
      {
        sourceCommit: base,
        scenario,
        port,
        basePath: `/baseline-${scenario}`,
        database: 'storage/database.sqlite',
        ...(await bindEnvironment(round)),
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`Prepared ${target}; read its AGENTS.md before developing.`);
} else {
  const identity = JSON.parse(await readFile(marker, 'utf8'));
  assert.equal(identity.scenario, scenario);
  assert.equal(identity.sourceCommit, base);
  assert.equal(identity.database, 'storage/database.sqlite');
  if (command === 'bind') {
    const binding = await bindEnvironment(requestedRound);
    await writeFile(
      marker,
      JSON.stringify({ ...identity, ...binding }, null, 2) + '\n',
    );
    console.log(JSON.stringify(binding));
  } else if (command === 'config' || command === 'start') {
    assert.equal(identity.environment, 'bounded-tailwind-client-v1');
    const checked = await verifyRuntime(target, identity.runtime.round);
    assert.equal(
      checked.profileSha256,
      identity.runtime.profileSha256,
      'Instance runtime profile changed',
    );
    console.log(JSON.stringify({ verifiedRuntime: checked }));
    if (command === 'config') {
      await pnpm(['nocobase', 'skills', 'sync']);
      await checkSyncedSkills(target);
      await pnpm(['nocobase', 'config', 'init', '--dialect', 'sqlite']);
      await pnpm(['nocobase', 'config', 'check']);
    } else {
      console.log(
        JSON.stringify({ synchronizedSkills: await checkSyncedSkills(target) }),
      );
      console.log(
        `Requested local test entry: http://127.0.0.1:${port}/baseline-${scenario}/; use the printed Local URL.`,
      );
      await pnpm(['dev']);
    }
  } else {
    // The only deletion scope is this marked disposable instance's storage, never arbitrary DB paths.
    assert(
      !(await stat(path.join(target, 'storage/.dev-server.lock')).catch(
        () => null,
      )),
      'Stop the development server before reset',
    );
    await rm(path.join(target, 'storage'), { recursive: true, force: true });
    console.log(
      `Reset ${scenario} test storage; restart to apply migrations and seed.`,
    );
  }
}
