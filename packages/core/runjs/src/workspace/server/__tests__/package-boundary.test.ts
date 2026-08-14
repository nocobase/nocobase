/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import path from 'node:path';

const packageRoot = path.resolve(__dirname, '../../../..');
const runjsSourceRoot = path.resolve(packageRoot, 'src');
const sourceRoot = path.resolve(__dirname, '../..');
const clientEntryRoots = [
  path.resolve(runjsSourceRoot, 'workspace/client'),
  path.resolve(runjsSourceRoot, 'workspace/client-v2'),
];
const prohibitedNeutralPackages = ['@nocobase/client', '@nocobase/client-v2', '@nocobase/flow-engine'];

describe('@nocobase/runjs workspace boundary', () => {
  it('does not depend on plugin lifecycle or JS Template domain implementations', () => {
    const violations = collectSourceFiles(sourceRoot)
      .filter((file) => !file.includes(`${path.sep}__tests__${path.sep}`))
      .flatMap((file) => {
        const source = fs.readFileSync(file, 'utf8');
        return [
          '@nocobase/plugin-flow-engine',
          '@nocobase/plugin-js-template',
          '/JsTemplateProjectService',
          '/JsTemplateService',
          '/SaveAsJsTemplateService',
        ]
          .filter((needle) => source.includes(needle))
          .map((needle) => `${path.relative(sourceRoot, file)} -> ${needle}`);
      });

    expect(violations).toEqual([]);
  });

  it('publishes explicit workspace subpath exports', () => {
    const manifest = JSON.parse(fs.readFileSync(path.resolve(packageRoot, 'package.json'), 'utf8')) as {
      exports?: Record<string, unknown>;
    };

    expect(manifest.exports).toMatchObject({
      './workspace/client': expect.any(Object),
      './workspace/client-v2': expect.any(Object),
      './workspace/server': expect.any(Object),
      './workspace/shared': expect.any(Object),
    });
  });

  it('keeps root, compiler, shared workspace, and server workspace independent from client hosts', () => {
    const neutralFiles = [
      path.resolve(runjsSourceRoot, 'index.ts'),
      ...collectSourceFiles(path.resolve(runjsSourceRoot, 'compiler')),
      ...collectSourceFiles(path.resolve(runjsSourceRoot, 'workspace/shared')),
      ...collectSourceFiles(path.resolve(runjsSourceRoot, 'workspace/server')),
    ].filter((file) => !file.includes(`${path.sep}__tests__${path.sep}`));
    const violations = neutralFiles.flatMap((file) => {
      const source = fs.readFileSync(file, 'utf8');
      return collectModuleSpecifiers(source)
        .filter((specifier) => isClientHostSpecifier(file, specifier))
        .map((specifier) => `${path.relative(runjsSourceRoot, file)} -> ${specifier}`);
    });

    expect(violations).toEqual([]);
  });

  it('keeps the client-v2 Workspace authoring compatibility files as forwarding wrappers', () => {
    const compatibilityRoot = path.resolve(runjsSourceRoot, 'workspace/client-v2/workspace/authoring');
    const violations = collectSourceFiles(compatibilityRoot).flatMap((file) => {
      const statements = fs
        .readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//gu, '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      return statements.every((statement) => /^export \* from ['"][^'"]+['"];$/.test(statement))
        ? []
        : [path.relative(runjsSourceRoot, file)];
    });

    expect(violations).toEqual([]);
  });
});

function collectModuleSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const moduleSpecifierPattern = /(?:from\s+|import\s*\(\s*|require\s*\(\s*|import\s+)['"]([^'"]+)['"]/gu;
  for (const match of source.matchAll(moduleSpecifierPattern)) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

function isClientHostSpecifier(file: string, specifier: string): boolean {
  if (
    prohibitedNeutralPackages.some(
      (packageName) => specifier === packageName || specifier.startsWith(`${packageName}/`),
    )
  ) {
    return true;
  }
  if (!specifier.startsWith('.')) {
    return false;
  }
  const resolved = path.resolve(path.dirname(file), specifier);
  return clientEntryRoots.some(
    (clientRoot) => resolved === clientRoot || resolved.startsWith(`${clientRoot}${path.sep}`),
  );
}

function collectSourceFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      return collectSourceFiles(absolutePath);
    }
    return entry.isFile() && /\.tsx?$/u.test(entry.name) ? [absolutePath] : [];
  });
}
