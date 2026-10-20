import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const repoRoot = path.resolve(import.meta.dirname, '../..');

/**
 * Model declaration consumers without requiring a workspace build. This is a focused
 * dependency-category regression, not a published-artifact check: @nocobase/db
 * and transitive packages still resolve through workspace links. The Verdaccio create-app smoke test covers packed
 * exports, installation, declaration emission, and startup outside the workspace.
 */
function installDeclarations(
  applicationRoot,
  relativePackage,
  outputDirectory,
) {
  const packageRoot = path.join(repoRoot, 'packages', relativePackage);
  const manifest = JSON.parse(
    readFileSync(path.join(packageRoot, 'package.json'), 'utf8'),
  );
  const installedPackage = path.join(
    applicationRoot,
    'node_modules',
    manifest.name,
  );
  mkdirSync(installedPackage, { recursive: true });
  writeFileSync(
    path.join(installedPackage, 'package.json'),
    JSON.stringify({ ...manifest, ...manifest.publishConfig }),
  );
  const sourceRoot = path.join(packageRoot, 'src');
  for (const entry of readdirSync(sourceRoot, { recursive: true })) {
    if (!entry.endsWith('.ts')) continue;
    const declaration = ts.transpileDeclaration(
      readFileSync(path.join(sourceRoot, entry), 'utf8'),
      { fileName: entry },
    );
    const output = path.join(
      installedPackage,
      outputDirectory,
      entry.replace(/\.ts$/, '.d.ts'),
    );
    mkdirSync(path.dirname(output), { recursive: true });
    writeFileSync(output, declaration.outputText);
  }
  symlinkSync(
    path.join(packageRoot, 'node_modules'),
    path.join(installedPackage, 'node_modules'),
    'dir',
  );
}

function checkDatabaseDeclarations(t, runtimeDependency) {
  const templateRoot = path.join(
    repoRoot,
    'packages/templates/app-template-default',
  );
  const root = mkdtempSync(
    path.join(tmpdir(), 'template-database-declarations-'),
  );
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const manifest = JSON.parse(
    readFileSync(path.join(templateRoot, 'package.json'), 'utf8'),
  );
  // TypeScript discovers runtime dependency symlinks when naming inferred types,
  // but does not scan devDependencies this way. Keep a negative control for that defect.
  if (!runtimeDependency) {
    manifest.devDependencies['@nocobase/db'] =
      manifest.dependencies['@nocobase/db'];
    delete manifest.dependencies['@nocobase/db'];
  }
  writeFileSync(path.join(root, 'package.json'), JSON.stringify(manifest));
  installDeclarations(root, 'app/app-server', 'dist');
  installDeclarations(root, 'libs/db-sqlite', 'dist/src');
  symlinkSync(
    realpathSync(path.join(templateRoot, 'node_modules/@nocobase/db')),
    path.join(root, 'node_modules/@nocobase/db'),
    'dir',
  );
  const file = path.join(root, 'database.ts');
  writeFileSync(
    file,
    readFileSync(path.join(templateRoot, 'server/config/database.ts')),
  );
  const program = ts.createProgram([file], {
    strict: true,
    skipLibCheck: true,
    declaration: true,
    emitDeclarationOnly: true,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    target: ts.ScriptTarget.ESNext,
    types: [],
    outDir: path.join(root, 'dist'),
  });
  const result = program.emit();
  const diagnostics = [
    ...ts.getPreEmitDiagnostics(program),
    ...result.diagnostics,
  ];
  if (!runtimeDependency) {
    assert.ok(diagnostics.some(({ code }) => code === 2883));
    return;
  }
  assert.deepEqual(
    diagnostics.map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
    ),
    [],
  );
  const declaration = readFileSync(
    path.join(root, 'dist/database.d.ts'),
    'utf8',
  );
  assert.ok(declaration.includes('import("@nocobase/db").ConnectionConfig'));
  assert.ok(!declaration.includes('node_modules'));
}

test('template runtime dependencies let TypeScript name inferred database declarations', (t) => {
  checkDatabaseDeclarations(t, true);
});

test('moving the database dependency back to devDependencies reproduces TS2883', (t) => {
  checkDatabaseDeclarations(t, false);
});
