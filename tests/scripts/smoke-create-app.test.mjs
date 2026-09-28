import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = new URL('../../scripts/smoke-create-app.sh', import.meta.url);

const fullRun = [
  // Configuration comes first: creation leaves the application unconfigured, and nothing after this can run without
  // it.
  'config init',
  'config check',
  'skills sync',
  'test',
  'dev',
  'build',
  'start',
  'deployed config check',
  'dist retarget',
];
const otherTarget =
  process.platform === 'linux' && process.arch === 'x64'
    ? 'linux-arm64'
    : 'linux-x64';

// Exercise the real shell lifecycle with HTTP servers and controlled pnpm outcomes, without downloading an app for
// every failure case. The CI action separately runs the same script with published packages and the real pnpm.
// The application CLI's top-level commands, such as `build` and `info`: the files directly under its commands directory.
// Every other id is `<topic> <command>`. Read rather than listed, so the fake below keeps up when one is added.
const topLevelCommands = fs
  .readdirSync(
    fileURLToPath(
      new URL('../../packages/app/app-cli/src/commands/', import.meta.url),
    ),
  )
  .filter((entry) => entry.endsWith('.ts'))
  .map((entry) => entry.slice(0, -'.ts'.length));

const fakePnpm = `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
// \`pnpm nocobase <topic> <command>\` is recorded as \`<topic> <command>\`, and a top-level command such as
// \`pnpm nocobase build\` as \`build\`: the ids the application CLI knows them by.
if (process.argv[2] === 'nocobase') {
  const words = ${JSON.stringify(topLevelCommands)}.includes(process.argv[3]) ? 1 : 2;
  process.argv.splice(2, 1 + words, process.argv.slice(3, 3 + words).join(' '));
}
const command = process.argv[2];
const scenario = process.env.SMOKE_SCENARIO;
const state = process.env.SMOKE_STATE;
const basePath = process.env.SMOKE_BASE_PATH;
if (command === 'config') {
  console.log(process.env.PNPM_CONFIG_REGISTRY);
} else if (command === 'create') {
  fs.mkdirSync(path.join(process.argv[4], 'node_modules'), { recursive: true });
  // create-app leaves the application unconfigured and keeps the template's example for config init to build from.
  fs.writeFileSync(path.join(process.argv[4], 'config.example.yml'), 'auth:\\n  secret: replace-me\\n');
  if (process.argv.includes('--json')) console.log(JSON.stringify({ schemaVersion: 1, ok: true, command: 'create-app', status: 'success', result: { dependenciesInstalled: true }, warnings: [] }));
} else if (command === 'config check' && process.cwd() === path.join(state, 'deploy', 'dist')) {
  // The deployed archive checks its configuration with its own CLI before it is started.
  fs.appendFileSync(path.join(state, 'commands'), 'deployed config check\\n');
  if (process.env.APP_CONFIG_FILE !== path.join(state, 'deploy', 'config.yml')) throw new Error('The deployed check must read the deployed config.yml');
  if (scenario === 'deploy-config-check-fails') { console.log(JSON.stringify({ ok: false })); process.exit(1); }
  console.log(JSON.stringify({ ok: true, status: 'passed', findings: [] }));
} else {
  if (process.cwd() !== path.join(state, 'crm')) throw new Error('Not in generated application');
  fs.appendFileSync(path.join(state, 'commands'), command + '\\n');
  if (command === 'add') {
    // Installing a driver is what decides the dialect; the smoke script runs it only for a non-SQLite run.
    fs.appendFileSync(path.join(state, 'added'), process.argv[3] + '\\n');
  } else if (command === 'config init') {
    if (scenario === 'config-init-fails') { console.log(JSON.stringify({ ok: false, reason: 'driver-missing' })); process.exit(1); }
    if (scenario === 'config-init-writes-nothing') { console.log(JSON.stringify({ ok: true })); }
    else {
      fs.writeFileSync('config.yml', 'auth:\\n  secret: generated\\n');
      console.log(JSON.stringify({ ok: true, status: 'configured', dialect: 'sqlite', configFile: path.join(process.cwd(), 'config.yml') }));
    }
  } else if (command === 'config check') {
    if (scenario === 'config-check-fails') { console.log(JSON.stringify({ ok: false, findings: [{ level: 'error', code: 'connection-failed' }] })); process.exit(1); }
    console.log(JSON.stringify({ ok: true, status: 'passed', findings: [] }));
  } else if (command === 'skills sync') {
    if (scenario === 'skills-fails') process.exit(8);
  } else if (command === 'test') {
    if (scenario === 'test-fails') process.exit(10);
  } else if (command === 'build') {
    const devPid = Number(fs.readFileSync(path.join(state, 'dev.pid'), 'utf8'));
    let alive = false;
    try { process.kill(devPid, 0); alive = true; } catch {}
    if (alive) throw new Error('Dev is still running during build');
    if (scenario === 'build-fails') process.exit(9);
    if (!process.argv.includes('--tar')) throw new Error('Build must pack the deployment archive');
    // A deployment tree: the entry the archive is started from, the manifest the retarget records into, and a
    // bundled native module carrying binaries for several platforms.
    const prebuilds = 'dist/node_modules/bundled-driver/prebuilds';
    fs.mkdirSync('dist/server', { recursive: true });
    fs.mkdirSync(prebuilds, { recursive: true });
    for (const platform of ['darwin-arm64', 'linux-x64', 'linux-arm64', 'linuxmusl-arm64']) {
      fs.writeFileSync(path.join(prebuilds, platform + '.node'), platform);
    }
    fs.writeFileSync('dist/package.json', JSON.stringify({
      name: 'crm-dist',
      nocobase: { buildTarget: { platform: process.platform, arch: process.arch, nodeMajor: 24, nodeAbi: 137 } },
    }));
    fs.copyFileSync(process.env.SMOKE_STANDALONE_SOURCE, 'dist/server/standalone.js');
    fs.writeFileSync('built', 'yes');
    if (scenario !== 'archive-missing') {
      fs.mkdirSync('storage/exports', { recursive: true });
      const entries = ['config.example.yml', 'dist'];
      if (scenario === 'archive-contains-config') entries.push('config.yml');
      execFileSync('tar', ['-czf', 'storage/exports/dist.tar.gz', ...entries]);
    }
  } else if (command === 'dist retarget') {
    const target = process.argv[process.argv.indexOf('--target') + 1];
    const nodeVersion = process.argv[process.argv.indexOf('--node-version') + 1];
    if (!target || nodeVersion !== '24') throw new Error('Retarget must name a target and Node 24');
    if (target === process.platform + '-' + process.arch) throw new Error('Retarget must name another platform');
    fs.writeFileSync(path.join(state, 'retarget-target'), target);
    if (scenario === 'retarget-fails') process.exit(11);
    const [platform, arch] = target.split('-');
    const manifest = JSON.parse(fs.readFileSync('dist/package.json', 'utf8'));
    manifest.nocobase.buildTarget = { platform, arch, libc: 'glibc', nodeMajor: 24, nodeAbi: 137 };
    fs.writeFileSync('dist/package.json', JSON.stringify(manifest));
    const prebuilds = 'dist/node_modules/bundled-driver/prebuilds';
    if (scenario !== 'retarget-leaves-binaries') {
      for (const file of fs.readdirSync(prebuilds)) {
        if (!file.includes(target)) fs.rmSync(path.join(prebuilds, file));
      }
    }
  } else {
    if (process.env.NOCOBASE_STRICT_STARTUP !== 'true') throw new Error('Strict startup must be enabled');
    if (command === 'start' && !fs.existsSync('built')) throw new Error('Start ran before build');
    if (scenario === command + '-exits') process.exit(7);
    const server = http.createServer((req, res) => {
      if (command === 'start' && req.url === basePath + '/api/healthz') {
        res.end(JSON.stringify({ ok: scenario !== 'unhealthy' }));
      } else if (req.url === basePath + '/') {
        res.statusCode = command === 'start' && scenario === 'homepage-fails' ? 500 : 200;
        res.end('<html>Generated app</html>');
      } else {
        res.statusCode = 404;
        res.end('Not found');
      }
    });
    const listen = () => server.listen(command === 'dev' ? 0 : Number(process.env.APP_SERVER_PORT), '127.0.0.1', () => {
      fs.writeFileSync(path.join(state, command + '.pid'), String(process.pid));
      if (command === 'dev') {
        if (scenario === 'job-load-fails') console.warn('Failed to load job from dispatch.d.ts: ReferenceError');
        console.log('App dev server ready');
        console.log('Local: http://127.0.0.1:' + server.address().port + basePath + '/');
      }
    });
    if (command === 'start' && scenario === 'start-log-unavailable') {
      const pendingStart = setInterval(() => {
        if (!fs.existsSync(path.join(state, 'start-log-read'))) return;
        clearInterval(pendingStart);
        listen();
      }, 10);
    } else {
      listen();
    }
  }
}
`;

// What the archive's dist/server/standalone.js does when a server starts it with node: refuses to run anywhere but
// the extracted deployment directory, with production settings and the configuration the guide places beside dist.
const fakeStandalone = `const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const scenario = process.env.SMOKE_SCENARIO;
const state = process.env.SMOKE_STATE;
const basePath = process.env.SMOKE_BASE_PATH;
const deployRoot = path.resolve(__dirname, '..', '..');
if (deployRoot !== path.join(state, 'deploy')) throw new Error('Standalone entry ran outside the deployment directory: ' + deployRoot);
if (process.env.NODE_ENV !== 'production') throw new Error('NODE_ENV must be production');
if (process.env.NOCOBASE_STRICT_STARTUP !== 'true') throw new Error('Strict startup must be enabled');
if (process.env.APP_CONFIG_FILE !== path.join(deployRoot, 'config.yml')) throw new Error('APP_CONFIG_FILE must name the deployed config.yml');
if (!fs.existsSync(process.env.APP_CONFIG_FILE)) throw new Error('The deployed config.yml is missing');
if (!fs.existsSync(path.join(deployRoot, 'storage'))) throw new Error('The deployment has no storage directory');
if (scenario === 'standalone-exits') process.exit(7);
const server = http.createServer((req, res) => {
  if (req.url === basePath + '/api/healthz') {
    res.end(JSON.stringify({ ok: true }));
  } else if (req.url === basePath + '/') {
    res.end('<html>Deployed app</html>');
  } else {
    res.statusCode = 404;
    res.end('Not found');
  }
});
server.listen(Number(process.env.APP_SERVER_PORT), '127.0.0.1', () => {
  fs.writeFileSync(path.join(state, 'standalone.pid'), String(process.pid));
});
`;

// Hold production readiness until the progress loop has encountered the same log-read failure as CI. Other tail
// calls still use the real command, including the registry configuration checks before the application starts.
const unavailableStartLogTail = `#!/usr/bin/env bash
if [ "$1" = '-n' ] && [ "$3" = "$SMOKE_STATE/start.log" ]; then
  echo "tail: cannot open '$3' for reading: No such file or directory" >&2
  : > "$SMOKE_STATE/start-log-read"
  exit 1
fi
PATH="\${PATH#*:}" exec tail "$@"
`;

async function runSmoke(t, scenario, basePath = '/main', extraArgs = []) {
  const workdir = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'smoke-script-test-')),
  );
  t.after(() => fs.rmSync(workdir, { recursive: true, force: true }));
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'smoke-script-bin-'));
  t.after(() => fs.rmSync(bin, { recursive: true, force: true }));
  for (const tool of ['pnpm', 'npm']) {
    fs.writeFileSync(path.join(bin, tool), fakePnpm, { mode: 0o755 });
  }
  const standaloneSource = path.join(bin, 'standalone.js');
  fs.writeFileSync(standaloneSource, fakeStandalone);
  if (scenario === 'start-log-unavailable') {
    fs.writeFileSync(path.join(bin, 'tail'), unavailableStartLogTail, {
      mode: 0o755,
    });
  }
  const child = spawn(
    'bash',
    [
      fileURLToPath(script),
      '--registry',
      'http://localhost:4873',
      '--create-app-version',
      '0.0.0-test',
      '--template',
      '@example/template@0.0.0-test',
      '--workdir',
      workdir,
      '--timeout',
      '3',
      ...extraArgs,
    ],
    {
      env: {
        ...process.env,
        PATH: `${bin}${path.delimiter}${process.env.PATH}`,
        SMOKE_SCENARIO: scenario,
        SMOKE_STATE: workdir,
        SMOKE_BASE_PATH: basePath,
        SMOKE_STANDALONE_SOURCE: standaloneSource,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30_000,
    },
  );
  let output = '';
  child.stdout.on('data', (data) => (output += data));
  child.stderr.on('data', (data) => (output += data));
  const code = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', resolve);
  });
  for (const phase of ['dev', 'start', 'standalone']) {
    const pidFile = path.join(workdir, `${phase}.pid`);
    if (fs.existsSync(pidFile)) {
      const pid = Number(fs.readFileSync(pidFile, 'utf8'));
      assert.throws(
        () => process.kill(pid, 0),
        `${phase} process leaked: ${output}`,
      );
    }
  }
  return {
    code,
    output,
    commands: fs.existsSync(path.join(workdir, 'commands'))
      ? fs
          .readFileSync(path.join(workdir, 'commands'), 'utf8')
          .trim()
          .split('\n')
      : [],
    retargetTarget: fs.existsSync(path.join(workdir, 'retarget-target'))
      ? fs.readFileSync(path.join(workdir, 'retarget-target'), 'utf8')
      : undefined,
    deployed: fs.existsSync(path.join(workdir, 'deploy', 'config.yml')),
  };
}

for (const basePath of ['', '/main', '/nested/app']) {
  test(`builds and starts the generated application at ${basePath || '/'}`, async (t) => {
    const result = await runSmoke(t, 'success', basePath);
    assert.equal(result.code, 0, result.output);
    assert.deepEqual(result.commands, fullRun);
    assert.match(
      result.output,
      /passed test, dev, build, start, archive deployment, and retarget/u,
    );
    assert.ok(result.output.includes(`${basePath}/api/healthz`));
    // The archive was extracted and started as a deployment, and the tree was retargeted for a platform this is not.
    assert.equal(result.deployed, true, result.output);
    assert.match(result.output, /started by the deployed archive is serving/u);
    assert.equal(result.retargetTarget, otherTarget);
    assert.ok(
      result.output.includes(`dist/package.json records ${otherTarget}`),
      result.output,
    );
  });
}

test('the fake pnpm records application commands by the id the application CLI knows them by', async (t) => {
  const state = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'smoke-fake-pnpm-')),
  );
  t.after(() => fs.rmSync(state, { recursive: true, force: true }));
  fs.mkdirSync(path.join(state, 'crm'));
  const fake = path.join(state, 'pnpm');
  fs.writeFileSync(fake, fakePnpm, { mode: 0o755 });
  const { spawnSync } = await import('node:child_process');
  const env = { ...process.env, SMOKE_STATE: state };
  delete env.NOCOBASE_STRICT_STARTUP;
  for (const argv of [
    ['nocobase', 'config', 'check', '--json'],
    ['nocobase', 'info', '--json'],
    ['nocobase', 'plugin', 'register', 'audit-log'],
  ]) {
    // The id is recorded before the fake acts on it; what it then does with a command it has no branch for — it
    // refuses to start one without strict startup — does not matter here.
    spawnSync(process.execPath, [fake, ...argv], {
      cwd: path.join(state, 'crm'),
      env,
      stdio: 'ignore',
    });
  }
  assert.deepEqual(
    fs.readFileSync(path.join(state, 'commands'), 'utf8').trim().split('\n'),
    ['config check', 'info', 'plugin register'],
  );
});

test('keeps waiting for production readiness when the progress log is unavailable', async (t) => {
  const result = await runSmoke(t, 'start-log-unavailable');
  assert.equal(result.code, 0, result.output);
  assert.deepEqual(result.commands, fullRun);
  assert.match(result.output, /tail: cannot open .*start\.log/u);
  assert.match(
    result.output,
    /passed test, dev, build, start, archive deployment, and retarget/u,
  );
});

for (const [scenario, commands, error] of [
  ['dev-exits', ['dev'], 'pnpm dev exited'],
  ['job-load-fails', ['dev'], 'Job discovery failed'],
  ['build-fails', ['dev', 'build'], 'pnpm build failed'],
  ['start-exits', ['dev', 'build', 'start'], 'pnpm start exited'],
  ['unhealthy', ['dev', 'build', 'start'], 'pnpm start did not become ready'],
  ['homepage-fails', ['dev', 'build', 'start'], 'did not serve its homepage'],
  [
    'archive-missing',
    ['dev', 'build', 'start'],
    'did not produce storage/exports/dist.tar.gz',
  ],
  [
    'archive-contains-config',
    ['dev', 'build', 'start'],
    'contains runtime configuration or data',
  ],
  [
    'deploy-config-check-fails',
    ['dev', 'build', 'start', 'deployed config check'],
    'pnpm nocobase config check failed in the deployed archive',
  ],
  [
    'standalone-exits',
    ['dev', 'build', 'start', 'deployed config check'],
    'the deployed archive exited before the application became ready',
  ],
  [
    'retarget-fails',
    ['dev', 'build', 'start', 'deployed config check', 'dist retarget'],
    'Retargeting native modules for',
  ],
  [
    'retarget-leaves-binaries',
    ['dev', 'build', 'start', 'deployed config check', 'dist retarget'],
    'Binaries for other platforms remain',
  ],
]) {
  test(`fails and cleans up when ${scenario}`, async (t) => {
    const result = await runSmoke(t, scenario);
    assert.equal(result.code, 1, result.output);
    assert.deepEqual(result.commands, [
      'config init',
      'config check',
      'skills sync',
      'test',
      ...commands,
    ]);
    assert.ok(result.output.includes(error), result.output);
  });
}

test('stops before anything runs when the configuration check fails', async (t) => {
  const result = await runSmoke(t, 'config-check-fails');
  assert.equal(result.code, 1, result.output);
  assert.deepEqual(result.commands, ['config init', 'config check']);
  assert.match(result.output, /pnpm nocobase config check reported a problem/u);
});

test('stops before dev when NocoBase package Skills cannot be synchronized', async (t) => {
  const result = await runSmoke(t, 'skills-fails');
  assert.equal(result.code, 8, result.output);
  assert.deepEqual(result.commands, [
    'config init',
    'config check',
    'skills sync',
  ]);
});

test('stops before dev, build, and start when the generated application tests fail', async (t) => {
  const result = await runSmoke(t, 'test-fails');
  assert.equal(result.code, 1, result.output);
  assert.deepEqual(result.commands, [
    'config init',
    'config check',
    'skills sync',
    'test',
  ]);
  assert.match(result.output, /pnpm test failed/u);
});

test('verifies JSON creation with a selected dialect', async (t) => {
  const result = await runSmoke(t, 'success', '/main', [
    '--dialect',
    'sqlite',
    '--json',
  ]);
  assert.equal(result.code, 0, result.output);
  assert.deepEqual(result.commands, fullRun);
});
