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
        './compiler/static-module-references',
        './package.json',
        './server',
        './settings',
      ].sort(),
    );
  });

  it.each([
    {
      subpath: 'compiler/loader',
      types: './lib/compiler/loader.d.ts',
      runtime: './lib/compiler/loader.js',
    },
    {
      subpath: 'compiler/build-identity',
      types: './lib/compiler/build-identity.d.ts',
      runtime: './lib/compiler/build-identity.js',
    },
    {
      subpath: 'compiler/static-module-references',
      types: './lib/compiler/static-module-references.d.ts',
      runtime: './lib/compiler/static-module-references.js',
    },
  ])('maps $subpath consistently across package manifests', ({ subpath, types, runtime }) => {
    expect(packageJson.exports[`./${subpath}`]).toEqual({
      types,
      import: runtime,
      require: runtime,
    });
    expect(packageJson.typesVersions?.['*']?.[subpath]).toEqual([types]);
  });
});
