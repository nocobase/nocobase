import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const [phase, directory, url] = process.argv.slice(2);
const root = path.resolve(directory);
const source = path.join(root, 'packages/shared/src/index.ts');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, text) => fs.writeFileSync(path.join(root, file), text);
const run = (args, expectFailure = false) => {
  const result = spawnSync('pnpm', args, {
    cwd: root,
    encoding: 'utf8',
    timeout: 180_000,
  });
  if (result.error) throw result.error;
  if (expectFailure) {
    assert.notEqual(
      result.status,
      0,
      'The stale consumer must fail typechecking',
    );
    assert.match(result.stdout + result.stderr, /workspace-type-probe/);
    assert.match(result.stdout + result.stderr, /revision/);
    console.log(
      'Confirmed that updated declarations reject the old application type.',
    );
  } else {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    assert.equal(result.status, 0, `pnpm ${args.join(' ')} failed`);
  }
};
async function waitFor(check, label) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await delay(300);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

if (phase === 'setup') {
  // Exercise the actual shipped Skill example, not a second hand-maintained fixture package.
  const created = spawnSync(
    process.execPath,
    [
      '.agents/skills/nocobase-app-development/scripts/create-internal-package.mjs',
    ],
    { cwd: root, stdio: 'inherit' },
  );
  assert.equal(created.status, 0);
  const manifest = JSON.parse(read('package.json'));
  manifest.dependencies['@my-app/shared'] = 'workspace:*';
  write('package.json', `${JSON.stringify(manifest, null, 2)}\n`);
  write(
    'client/workspace-smoke.ts',
    `import { greet } from '@my-app/shared';
globalThis.document.documentElement.dataset.workspaceGreeting = greet('Ada').message;
if (import.meta.hot) import.meta.hot.accept('@my-app/shared', (module) => {
  if (module) globalThis.document.documentElement.dataset.workspaceGreeting = module.greet('Ada').message;
});
`,
  );
  write(
    'client/index.tsx',
    `import './workspace-smoke.js';\n${read('client/index.tsx')}`,
  );
  write(
    'server/routes/workspace-smoke.ts',
    `import { greet } from '@my-app/shared';
import type { Application } from '@nocobase/app-server/application';
import { defineApiRoutes, describeRoute, dataResponse, type AppApiRouteContribution } from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { z } from 'zod';
// Intentionally public: this disposable smoke fixture returns only a constant greeting.
export const workspaceSmokeRoutes: AppApiRouteContribution<Application> = defineApiRoutes(() => {
  const router = new Hono();
  router.get('/workspaceSmoke', describeRoute({
    tags: ['Workspace smoke'], summary: 'Read the internal package greeting', operationId: 'workspaceSmokeGreeting', security: [],
    responses: { 200: dataResponse(z.object({ message: z.string() })) },
  }), (context) => context.json({ data: greet('Ada') }));
  return router;
});
`,
  );
  write(
    'server/routes/index.ts',
    `import { workspaceSmokeRoutes } from './workspace-smoke.js';\n${read('server/routes/index.ts').replace('= [', '= [workspaceSmokeRoutes, ')}`,
  );
  run(['install']);
  run(['--filter', '@my-app/shared', 'fix']);
  run(['check:packages']);
  run(['typecheck']);
} else if (phase === 'dev' || phase === 'verify') {
  const require = createRequire(path.join(root, 'package.json'));
  const { chromium } = require(
    fs.existsSync(path.join(root, 'node_modules.smoke-hidden'))
      ? path.join(root, 'node_modules.smoke-hidden/@playwright/test')
      : '@playwright/test',
  );
  const browser = await chromium.launch({ headless: true });
  let watcher;
  try {
    const page = await browser.newPage();
    page.on('pageerror', (error) =>
      console.error(`[browser] ${error.message}`),
    );
    page.on('console', (message) => {
      if (message.type() === 'error')
        console.error(`[browser] ${message.text()}`);
    });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    const greeting = phase === 'dev' ? 'Hello, Ada!' : 'Welcome, Ada!';
    await page.waitForFunction(
      (expected) =>
        globalThis.document.documentElement.dataset.workspaceGreeting ===
        expected,
      greeting,
      { timeout: 120_000 },
    );
    const endpoint = new URL(
      'api/workspaceSmoke',
      url.endsWith('/') ? url : `${url}/`,
    );
    const serverHas = async (message) => {
      try {
        const response = await fetch(endpoint, {
          signal: AbortSignal.timeout(2000),
        });
        return response.ok && (await response.json()).data.message === message;
      } catch {
        return false;
      }
    };
    await waitFor(() => serverHas(greeting), 'the server package greeting');
    if (phase === 'dev') {
      watcher = spawn('pnpm', ['--filter', '@my-app/shared', 'dev:types'], {
        cwd: root,
        stdio: 'ignore',
        detached: true,
      });
      // The page marker must survive the update: a full reload would not verify HMR.
      await page.evaluate(() => {
        globalThis.document.documentElement.dataset.workspaceMarker =
          'preserved';
      });
      await delay(1000);
      const original = fs.readFileSync(source, 'utf8');
      fs.writeFileSync(
        source,
        original
          .replace('message: string;', 'message: string; revision: string;')
          .replace('return { message:', "return { revision: 'new', message:")
          .replace('Hello,', 'Welcome,'),
      );
      await waitFor(
        () => read('packages/shared/dist/index.d.ts').includes('revision'),
        'updated declarations',
      );
      write(
        'client/workspace-type-probe.ts',
        "import type { Greeting } from '@my-app/shared';\nexport const legacy: Greeting = { message: 'old API' };\n",
      );
      try {
        run(['typecheck'], true);
      } finally {
        fs.rmSync(path.join(root, 'client/workspace-type-probe.ts'), {
          force: true,
        });
      }
      await page.waitForFunction(
        () =>
          globalThis.document.documentElement.dataset.workspaceGreeting ===
          'Welcome, Ada!',
        undefined,
        { timeout: 60_000 },
      );
      assert.equal(
        await page.evaluate(
          () => globalThis.document.documentElement.dataset.workspaceMarker,
        ),
        'preserved',
        'The client must update without a page reload',
      );
      await waitFor(
        () => serverHas('Welcome, Ada!'),
        'a server restart with the edited source',
      );
      // Leave a passing package for the deployment build after testing the incompatible type change.
      fs.writeFileSync(source, original.replace('Hello,', 'Welcome,'));
      write(
        'packages/shared/tests/greet.test.ts',
        read('packages/shared/tests/greet.test.ts').replace(
          'Hello,',
          'Welcome,',
        ),
      );
      await waitFor(
        () => !read('packages/shared/dist/index.d.ts').includes('revision'),
        'restored declarations',
      );
      run(['typecheck']);
    }
  } finally {
    if (
      watcher?.pid &&
      watcher.exitCode === null &&
      watcher.signalCode === null
    ) {
      const exited = new Promise((resolve) => watcher.once('close', resolve));
      process.kill(-watcher.pid, 'SIGTERM');
      await exited;
    }
    await browser.close();
  }
} else if (phase === 'hide' || phase === 'restore') {
  // Keep artifacts for inspection while making every original source path unavailable to the deployment.
  for (const name of ['packages', 'client', 'server', 'node_modules']) {
    const live = path.join(root, name);
    const hidden = path.join(root, `${name}.smoke-hidden`);
    if (phase === 'hide') fs.renameSync(live, hidden);
    else if (fs.existsSync(hidden)) fs.renameSync(hidden, live);
  }
} else {
  throw new Error('Expected setup, dev, verify, hide, or restore.');
}
console.log(`Internal workspace acceptance: ${phase} passed.`);
