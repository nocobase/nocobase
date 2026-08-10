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
        './js-template',
        './js-template/client',
        './js-template/schema',
        './js-template/schema/entry-v1.schema.json',
        './js-template/schema/server',
        './js-template/shared',
        './js-template/typegen',
        './package.json',
        './server',
        './settings',
        './workspace',
        './workspace/client',
        './workspace/client-v2',
        './workspace/server',
        './workspace/shared',
        './workspace/swagger',
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
    {
      subpath: 'js-template/client',
      types: './lib/js-template/client/index.d.ts',
      runtime: './lib/js-template/client/index.js',
    },
    {
      subpath: 'js-template/schema',
      types: './lib/js-template/schema/index.d.ts',
      runtime: './lib/js-template/schema/index.js',
    },
    {
      subpath: 'js-template/typegen',
      types: './lib/js-template/typegen/index.d.ts',
      runtime: './lib/js-template/typegen/index.js',
    },
    {
      subpath: 'workspace/client',
      types: './lib/workspace/client/index.d.ts',
      runtime: './lib/workspace/client/index.js',
    },
    {
      subpath: 'workspace/client-v2',
      types: './lib/workspace/client-v2/index.d.ts',
      runtime: './lib/workspace/client-v2/index.js',
    },
    {
      subpath: 'workspace/server',
      types: './lib/workspace/server/index.d.ts',
      runtime: './lib/workspace/server/index.js',
    },
    {
      subpath: 'workspace/shared',
      types: './lib/workspace/shared/index.d.ts',
      runtime: './lib/workspace/shared/index.js',
    },
  ])('maps $subpath consistently across package manifests', ({ subpath, types, runtime }) => {
    expect(packageJson.exports[`./${subpath}`]).toEqual({
      types,
      import: runtime,
      require: runtime,
    });
    expect(packageJson.typesVersions?.['*']?.[subpath]).toEqual([types]);
  });

  it('publishes the JS Template schema from the canonical package', () => {
    expect(packageJson.exports['./js-template/schema/entry-v1.schema.json']).toBe(
      './lib/js-template/schema/entry-v1.schema.json',
    );
  });
});
