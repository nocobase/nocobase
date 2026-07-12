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
      return forbiddenImports
        .filter((specifier) => source.includes(`'${specifier}'`) || source.includes(`"${specifier}"`))
        .map((specifier) => `${path.relative(sourceRoot, file)} -> ${specifier}`);
    });

    expect(violations).toEqual([]);
  });
});

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath);
    }
    return /\.tsx?$/u.test(entry.name) ? [entryPath] : [];
  });
}
