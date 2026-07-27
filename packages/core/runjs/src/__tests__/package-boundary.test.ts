/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const forbiddenImports = [
  '@nocobase/database',
  '@nocobase/server',
  '@nocobase/client',
  '@nocobase/client-v2',
  'react',
  'koa',
];

describe('@nocobase/runjs package boundary', () => {
  it('exposes the server declarations to legacy TypeScript module resolution', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'));

    expect(packageJson.typesVersions?.['*']?.server).toEqual(['./lib/server.d.ts']);
  });

  it('does not import application, plugin, database, UI, or Koa runtimes', () => {
    const sourceRoot = path.resolve(__dirname, '..');
    const sourceFiles = collectSourceFiles(sourceRoot).filter(
      (file) => !file.includes(`${path.sep}__tests__${path.sep}`),
    );
    const violations = sourceFiles.flatMap((file) => {
      const source = fs.readFileSync(file, 'utf8');
      const importedSpecifiers = collectRuntimeImportSpecifiers(source, file);
      return forbiddenImports
        .filter((specifier) => importedSpecifiers.has(specifier))
        .map((specifier) => `${path.relative(sourceRoot, file)} -> ${specifier}`);
    });

    expect(violations).toEqual([]);
  });

  it('keeps the portable compiler boundary free of Node and native compiler imports', () => {
    const portableSource = fs.readFileSync(path.resolve(__dirname, '../compiler/portable.ts'), 'utf8');
    const importedSpecifiers = collectRuntimeImportSpecifiers(portableSource, 'portable.ts');

    expect([...importedSpecifiers]).toEqual([]);
    expect(portableSource).not.toMatch(/(?:from|import\()\s*['"](?:node:|crypto|fs|path|esbuild)/u);
  });

  it('keeps the isomorphic root entry free of Node built-in imports', () => {
    const rootSource = fs.readFileSync(path.resolve(__dirname, '../index.ts'), 'utf8');
    const importedSpecifiers = collectRuntimeImportSpecifiers(rootSource, 'index.ts');

    for (const nodeBuiltin of ['crypto', 'node:crypto', 'path', 'node:path', 'fs', 'node:fs']) {
      expect(importedSpecifiers.has(nodeBuiltin)).toBe(false);
    }
    expect(rootSource).not.toMatch(/(?:from|import\()\s*['"](?:node:)?(?:crypto|fs|path)['"]/u);
  });

  it('never lets a browser-facing entrypoint transitively reach crypto or the server module', () => {
    const sourceRoot = path.resolve(__dirname, '..');
    const browserEntrypoints = ['index.ts', 'client-v2/index.ts', 'compiler/portable.ts', 'settings/index.ts'].map(
      (relativePath) => path.join(sourceRoot, relativePath),
    );

    const visited = new Set<string>();
    const violations: string[] = [];

    const resolveRelativeImport = (fromFile: string, specifier: string): string | undefined => {
      const base = path.resolve(path.dirname(fromFile), specifier);
      return [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')].find(
        (candidate) => fs.existsSync(candidate),
      );
    };

    const walk = (file: string): void => {
      if (visited.has(file)) {
        return;
      }
      visited.add(file);
      for (const specifier of collectValueImportSpecifiers(fs.readFileSync(file, 'utf8'), file)) {
        if (
          specifier === 'crypto' ||
          specifier === 'node:crypto' ||
          specifier === '@nocobase/runjs/server' ||
          /(?:^\.\.?\/|^)server$/u.test(specifier)
        ) {
          violations.push(`${path.relative(sourceRoot, file)} -> ${specifier}`);
          continue;
        }
        if (specifier.startsWith('.')) {
          const resolved = resolveRelativeImport(file, specifier);
          if (resolved) {
            walk(resolved);
          }
        }
      }
    };

    browserEntrypoints.forEach(walk);

    expect(violations).toEqual([]);
  });
});

function collectRuntimeImportSpecifiers(source: string, fileName: string): Set<string> {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
  const specifiers = new Set<string>();

  const visit = (node: ts.Node): void => {
    if (ts.isModuleDeclaration(node) && ts.isStringLiteral(node.name)) {
      return;
    }
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.add(node.moduleSpecifier.text);
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression &&
      ts.isStringLiteral(node.moduleReference.expression)
    ) {
      specifiers.add(node.moduleReference.expression.text);
    } else if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0]) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      specifiers.add(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return specifiers;
}

// Collects only the module specifiers that survive to runtime. `import type` / `export type` edges and named
// imports/exports whose specifiers all carry the inline `type` modifier are erased by the TypeScript compiler, so a
// browser bundle never loads those modules. Reachability must follow value edges only — otherwise a purely type-level
// reference to a Node-only module (e.g. a data file importing a `type` from the build-time `generator`) would be a
// false positive.
function collectValueImportSpecifiers(source: string, fileName: string): Set<string> {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
  const specifiers = new Set<string>();

  const visit = (node: ts.Node): void => {
    if (ts.isModuleDeclaration(node) && ts.isStringLiteral(node.name)) {
      return;
    }
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      if (isValueImportDeclaration(node)) {
        specifiers.add(node.moduleSpecifier.text);
      }
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      if (isValueExportDeclaration(node)) {
        specifiers.add(node.moduleSpecifier.text);
      }
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression &&
      ts.isStringLiteral(node.moduleReference.expression)
    ) {
      specifiers.add(node.moduleReference.expression.text);
    } else if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0]) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      specifiers.add(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return specifiers;
}

function isValueImportDeclaration(node: ts.ImportDeclaration): boolean {
  const clause = node.importClause;
  if (!clause) {
    return true; // side-effect import: `import './x'`
  }
  if (clause.isTypeOnly) {
    return false; // `import type { ... } from './x'`
  }
  if (clause.name) {
    return true; // default import binds a value
  }
  const bindings = clause.namedBindings;
  if (!bindings || ts.isNamespaceImport(bindings)) {
    return true; // `import * as ns from './x'` (or an empty clause) loads the module at runtime
  }
  return bindings.elements.some((element) => !element.isTypeOnly);
}

function isValueExportDeclaration(node: ts.ExportDeclaration): boolean {
  if (node.isTypeOnly) {
    return false; // `export type { ... } from './x'`
  }
  const clause = node.exportClause;
  if (!clause || ts.isNamespaceExport(clause)) {
    return true; // `export * from './x'` / `export * as ns from './x'` re-export runtime values
  }
  return clause.elements.some((element) => !element.isTypeOnly);
}

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath);
    }
    return /\.tsx?$/u.test(entry.name) ? [entryPath] : [];
  });
}
