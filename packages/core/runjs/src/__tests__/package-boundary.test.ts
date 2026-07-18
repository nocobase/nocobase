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
  '@nocobase/plugin-vsc-file',
  '@nocobase/database',
  '@nocobase/server',
  '@nocobase/client',
  '@nocobase/client-v2',
  'react',
  'koa',
];

describe('@nocobase/runjs package boundary', () => {
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

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath);
    }
    return /\.tsx?$/u.test(entry.name) ? [entryPath] : [];
  });
}
