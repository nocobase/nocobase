import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const repoRoot = path.resolve(import.meta.dirname, '../..');

// These versions belong to synthetic packages, not to the repository's release cycle. Install real file packages
// outside the workspace so workspace links cannot hide two database declarations with private members.
test('upgrades a mixed-db lockfile to host-provided peers, including production installs', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'shared-db-install-'));
  const write = (relative, contents) => {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      typeof contents === 'string'
        ? contents
        : `${JSON.stringify(contents, null, 2)}\n`,
    );
  };
  const install = (...args) =>
    execFileSync(
      'pnpm',
      [
        'install',
        '--offline',
        '--ignore-scripts',
        '--store-dir',
        path.join(root, 'store'),
        ...args,
      ],
      {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, CI: 'true' },
        timeout: 60_000,
      },
    );
  try {
    for (const [folder, version] of [
      ['old-db', '1.0.0'],
      ['host-db', '1.1.0'],
    ]) {
      write(`${folder}/package.json`, {
        name: '@nocobase/db',
        version,
        main: 'index.js',
        types: 'index.d.ts',
      });
      write(
        `${folder}/index.js`,
        'exports.DatabaseConnection = class DatabaseConnection {};\n',
      );
      write(
        `${folder}/index.d.ts`,
        'export declare class DatabaseConnection { private schemaAdapter; }\n',
      );
    }
    const libraries = ['authorization', 'ai-employee'];
    const dependency = {};
    for (const name of libraries) {
      const manifest = JSON.parse(
        fs.readFileSync(
          path.join(repoRoot, 'packages/libs', name, 'package.json'),
          'utf8',
        ),
      );
      assert.equal(manifest.dependencies?.['@nocobase/db'], undefined, name);
      assert.equal(
        manifest.peerDependencies['@nocobase/db'],
        'workspace:^',
        name,
      );
      dependency[manifest.name] = `file:./${name}`;
      write(`${name}/package.json`, {
        name: manifest.name,
        version: '1.0.0',
        main: 'index.js',
        types: 'index.d.ts',
        dependencies: { '@nocobase/db': 'file:../old-db' },
      });
      write(
        `${name}/index.js`,
        "exports.db = require.resolve('@nocobase/db');\n",
      );
      write(
        `${name}/index.d.ts`,
        "import { DatabaseConnection } from '@nocobase/db';\nexport declare function accept(connection: DatabaseConnection): void;\n",
      );
    }
    write('package.json', {
      name: 'shared-db-install-fixture',
      private: true,
      dependencies: { '@nocobase/db': 'file:./host-db', ...dependency },
    });
    write(
      'pnpm-workspace.yaml',
      'autoInstallPeers: false\nstrictPeerDependencies: true\nminimumReleaseAge: 0\n',
    );
    write(
      'consumer.ts',
      "import { DatabaseConnection } from '@nocobase/db';\n" +
        libraries
          .map(
            (name, i) =>
              `import { accept as accept${i} } from '@nocobase/${name}';\naccept${i}(new DatabaseConnection());\n`,
          )
          .join(''),
    );
    const check = () =>
      ts.getPreEmitDiagnostics(
        ts.createProgram([path.join(root, 'consumer.ts')], {
          noEmit: true,
          strict: true,
          skipLibCheck: true,
          types: [],
          module: ts.ModuleKind.NodeNext,
          moduleResolution: ts.ModuleResolutionKind.NodeNext,
        }),
      );
    install();
    assert.equal(
      check().filter((d) => d.code === 2345).length,
      libraries.length,
      'old dependencies must reproduce the nominal type conflict',
    );

    for (const name of libraries) {
      write(`${name}/package.json`, {
        name: `@nocobase/${name}`,
        version: '1.0.1',
        main: 'index.js',
        types: 'index.d.ts',
        peerDependencies: { '@nocobase/db': '^1.0.0' },
      });
    }
    // Keep the old lockfile: a clean install alone would miss the reported upgrade path.
    install('--no-frozen-lockfile', '--prod');
    assert.deepEqual(
      check().map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')),
      [],
    );
    const require = createRequire(path.join(root, 'package.json'));
    const hostDb = require.resolve('@nocobase/db');
    for (const name of libraries) {
      assert.equal(require(`@nocobase/${name}`).db, hostDb, name);
    }
    const lock = fs.readFileSync(path.join(root, 'pnpm-lock.yaml'), 'utf8');
    install('--frozen-lockfile', '--prod');
    assert.equal(
      fs.readFileSync(path.join(root, 'pnpm-lock.yaml'), 'utf8'),
      lock,
    );
    assert.deepEqual(check(), []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
