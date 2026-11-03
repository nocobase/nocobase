import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { installSample } from '../fixtures/list-recovery/install.mjs';
import { connectSample } from '../fixtures/list-recovery/connect.mjs';

const root = path.resolve(import.meta.dirname, '../..');
for (const template of ['default', 'examples']) {
  test(`installs the business fixture without losing ${template} composition or claiming an upgrade`, async () => {
    const app = await mkdtemp(path.join(os.tmpdir(), 'list-recovery-fixture-'));
    try {
      for (const directory of [
        'client/pages',
        'client/hooks',
        'server/routes',
        'database/main/migrations',
      ]) {
        await mkdir(path.join(app, directory), { recursive: true });
      }
      const templateRoot = path.join(
        root,
        'packages/templates',
        `app-template-${template}`,
      );
      const manifest = JSON.parse(
        await readFile(path.join(templateRoot, 'package.json'), 'utf8'),
      );
      manifest.nocobase.templatePackage = manifest.name;
      await writeFile(path.join(app, 'package.json'), JSON.stringify(manifest));
      for (const relative of ['client/routes.ts', 'server/routes/index.ts']) {
        await writeFile(
          path.join(app, relative),
          await readFile(path.join(templateRoot, relative)),
        );
      }
      const originalServer = await readFile(
        path.join(app, 'server/routes/index.ts'),
        'utf8',
      );
      const originalClient = await readFile(
        path.join(app, 'client/routes.ts'),
        'utf8',
      );
      const originalManifest = await readFile(
        path.join(app, 'package.json'),
        'utf8',
      );
      await installSample(app);
      const client = await readFile(path.join(app, 'client/routes.ts'), 'utf8');
      const server = await readFile(
        path.join(app, 'server/routes/index.ts'),
        'utf8',
      );
      assert.equal(
        client.replace(/\n  \{\n    name: 'loans',[\s\S]*?\n  \},/u, ''),
        originalClient,
      );
      assert.equal(
        server
          .replace("import loans from './loans.js';\n", '')
          .replace(' = [loans,', ' = ['),
        originalServer,
      );
      await assert.rejects(installSample(app), /Refusing to overwrite/u);
      const before = await readFile(
        path.join(app, 'client/pages/loans.tsx'),
        'utf8',
      );
      await assert.rejects(connectSample(app), /ENOENT/u);
      assert.equal(
        await readFile(path.join(app, 'client/pages/loans.tsx'), 'utf8'),
        before,
      );
      for (const hook of [
        'use-list-data',
        'use-list-location',
        'use-table-url-state',
      ]) {
        await writeFile(
          path.join(app, `client/hooks/${hook}.ts`),
          '// verified target hook placeholder for fixture wiring only\n',
        );
      }
      await connectSample(app);
      const connected = await readFile(
        path.join(app, 'client/pages/loans.tsx'),
        'utf8',
      );
      assert.ok(!connected.includes('UPGRADE_'));
      assert.ok(connected.includes('useListData<LoanPage>'));
      assert.ok(connected.includes('useTableUrlState'));
      assert.equal(
        await readFile(path.join(app, 'package.json'), 'utf8'),
        originalManifest,
      );
    } finally {
      await rm(app, { recursive: true, force: true });
    }
  });
}
