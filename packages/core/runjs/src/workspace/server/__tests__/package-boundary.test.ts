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
const prohibitedNeutralPackages = [
  '@nocobase/client',
  '@nocobase/client-v2',
  '@nocobase/flow-engine',
  '@ant-design/icons',
  'antd',
  'react',
  'react-dom',
];

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

  it('publishes only neutral and server workspace subpath exports', () => {
    const manifest = JSON.parse(fs.readFileSync(path.resolve(packageRoot, 'package.json'), 'utf8')) as {
      exports?: Record<string, unknown>;
    };

    expect(manifest.exports).toMatchObject({
      './workspace/server': expect.any(Object),
      './workspace/shared': expect.any(Object),
      './workspace/swagger': expect.any(Object),
    });
    expect(manifest.exports).not.toHaveProperty('./workspace/client');
    expect(manifest.exports).not.toHaveProperty('./workspace/client-v2');
  });

  it('keeps every retained RunJS entry independent from client and UI hosts', () => {
    const neutralFiles = collectSourceFiles(runjsSourceRoot).filter(
      (file) => !file.includes(`${path.sep}__tests__${path.sep}`),
    );
    const violations = neutralFiles.flatMap((file) => {
      const source = fs.readFileSync(file, 'utf8');
      return collectModuleSpecifiers(source)
        .filter((specifier) => isClientHostSpecifier(file, specifier))
        .map((specifier) => `${path.relative(runjsSourceRoot, file)} -> ${specifier}`);
    });

    expect(violations).toEqual([]);
  });

  it('does not retain client workspace implementation directories', () => {
    expect(clientEntryRoots.map((clientRoot) => fs.existsSync(clientRoot))).toEqual([false, false]);
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
    specifier.startsWith('@nocobase/plugin-') ||
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
