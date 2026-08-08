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

const packageRoot = path.resolve(__dirname, '../..');
interface RunJSPackageJson {
  exports: Record<string, unknown>;
  typesVersions?: Record<string, Record<string, string[]>>;
}

const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as RunJSPackageJson;

describe('@nocobase/runjs package exports', () => {
  it('exposes only supported public entry points', () => {
    expect(Object.keys(packageJson.exports).sort()).toEqual(
      [
        '.',
        './compiler',
        './compiler/build-identity',
        './compiler/loader',
        './compiler/portable',
        './package.json',
        './server',
        './settings',
      ].sort(),
    );
  });

  it('exposes the source-safe compiler loader through its dedicated subpath', () => {
    const compilerLoaderExport = packageJson.exports['./compiler/loader'];

    expect(compilerLoaderExport).toEqual({
      types: './lib/compiler/loader.d.ts',
      import: './lib/compiler/loader.js',
      require: './lib/compiler/loader.js',
    });
    expect(packageJson.typesVersions?.['*']?.['compiler/loader']).toEqual(['./lib/compiler/loader.d.ts']);
    expect(fs.existsSync(path.join(packageRoot, 'src/compiler/loader.ts'))).toBe(true);
  });

  it('exposes the compiler build identity through its dedicated subpath', () => {
    const buildIdentityExport = packageJson.exports['./compiler/build-identity'];

    expect(buildIdentityExport).toEqual({
      types: './lib/compiler/build-identity.d.ts',
      import: './lib/compiler/build-identity.js',
      require: './lib/compiler/build-identity.js',
    });
    expect(packageJson.typesVersions?.['*']?.['compiler/build-identity']).toEqual([
      './lib/compiler/build-identity.d.ts',
    ]);
    expect(fs.existsSync(path.join(packageRoot, 'src/compiler/build-identity.ts'))).toBe(true);
  });
});
