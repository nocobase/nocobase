/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const compilerLoaderPath = path.resolve(__dirname, '../compiler/loader.ts');
const compilerJavaScriptPath = path.resolve(__dirname, '../compiler/index.js');

describe('loadRunJSCompiler', () => {
  it('loads the TypeScript source entry when the adjacent JavaScript build is absent', () => {
    expect(fs.existsSync(compilerJavaScriptPath)).toBe(false);

    expect(
      runLoaderScript(`
        loadRunJSCompiler().then((compiler) => {
          if (typeof compiler.compileRunJSSourceWorkspace !== 'function') process.exit(1);
          process.stdout.write('compiler loaded');
        });
      `),
    ).toBe('compiler loaded');
  });

  it('preserves a built entry transitive module-not-found error without loading the source entry', () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'runjs-compiler-loader-'));
    try {
      fs.copyFileSync(compilerLoaderPath, path.join(fixtureRoot, 'loader.ts'));
      fs.writeFileSync(
        path.join(fixtureRoot, 'source-inspection.ts'),
        'export const inspectRunJSSourceCode = () => undefined;\n',
      );
      fs.writeFileSync(
        path.join(fixtureRoot, 'index.js'),
        `
          globalThis.__compilerEntryLoads = (globalThis.__compilerEntryLoads || 0) + 1;
          const error = Object.assign(new Error('Cannot find package "missing-transitive-dependency"'), {
            code: 'ERR_MODULE_NOT_FOUND',
            url: 'file:///missing-transitive-dependency/index.js',
          });
          globalThis.__firstCompilerEntryError ||= error;
          throw error;
        `,
      );

      expect(
        runLoaderScript(
          `
            loadRunJSCompiler().then(
              () => process.exit(1),
              (error) => {
                if (error !== globalThis.__firstCompilerEntryError) process.exit(2);
                if (error.code !== 'ERR_MODULE_NOT_FOUND') process.exit(3);
                if (globalThis.__compilerEntryLoads !== 1) process.exit(4);
                process.stdout.write(error.url);
              },
            );
          `,
          path.join(fixtureRoot, 'loader.ts'),
        ),
      ).toBe('file:///missing-transitive-dependency/index.js');
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it('reuses the module-level compiler loading promise', () => {
    expect(
      runLoaderScript(`
        const firstLoad = loadRunJSCompiler();
        const secondLoad = loadRunJSCompiler();
        if (firstLoad !== secondLoad) process.exit(1);
        firstLoad.then(() => process.stdout.write('promise reused'));
      `),
    ).toBe('promise reused');
  });
});

function runLoaderScript(script: string, loaderPath = compilerLoaderPath): string {
  return execFileSync(
    process.execPath,
    ['--import', 'tsx', '--eval', `const { loadRunJSCompiler } = require(${JSON.stringify(loaderPath)}); ${script}`],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
    },
  );
}
