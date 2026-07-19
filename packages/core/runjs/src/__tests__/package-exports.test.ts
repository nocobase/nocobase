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
const removedPublicNames = [
  'RunJSEntryCompilerSession',
  'RunJSEntryDependencyManifest',
  'buildRunJSEntryDependencyManifestFromGraph',
  'collectRunJSWorkspaceDependencyManifest',
];

describe('@nocobase/runjs package exports', () => {
  it('exposes only supported public entry points', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as {
      exports: Record<string, unknown>;
    };

    expect(Object.keys(packageJson.exports).sort()).toEqual(
      ['.', './client-v2', './compiler', './compiler/portable', './package.json', './settings'].sort(),
    );
  });

  it('keeps removed dependency and session APIs out of built public declarations', () => {
    const declarations = [
      fs.readFileSync(path.join(packageRoot, 'lib/index.d.ts'), 'utf8'),
      fs.readFileSync(path.join(packageRoot, 'lib/compiler/index.d.ts'), 'utf8'),
    ].join('\n');

    for (const name of removedPublicNames) {
      expect(declarations).not.toContain(name);
    }
    expect(declarations).not.toContain("export * from './dependency-collector'");
    expect(declarations).not.toContain("export * from './session'");
  });
});
