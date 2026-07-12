/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { compileRunJSSourceWorkspace } from '../compiler';

describe('@nocobase/runjs compiler golden contracts', () => {
  it.each([
    {
      name: 'single TypeScript file',
      files: [{ path: 'index.ts', content: 'const label: string = "TS"; ctx.message.success(label);' }],
      entry: 'index.ts',
      surfaceStyle: 'action' as const,
      expectedCode: 'ctx.message.success(label)',
    },
    {
      name: 'TSX with shared named import',
      files: [
        { path: 'index.tsx', content: "import { label } from './shared'; ctx.render(<div>{label}</div>);" },
        { path: 'shared.ts', content: 'export const label = "SHARED";' },
      ],
      entry: 'index.tsx',
      surfaceStyle: 'render' as const,
      expectedCode: 'SHARED',
    },
    {
      name: 'default and JSON imports',
      files: [
        {
          path: 'index.ts',
          content: "import value from './value'; import config from './config.json'; return value + config.suffix;",
        },
        { path: 'value.ts', content: 'export default "DEFAULT";' },
        { path: 'config.json', content: '{"suffix":"_JSON"}' },
      ],
      entry: 'index.ts',
      surfaceStyle: 'value' as const,
      expectedCode: '_JSON',
    },
  ])('keeps the $name artifact shape stable', ({ files, entry, surfaceStyle, expectedCode }) => {
    const result = compileRunJSSourceWorkspace({ files, entry, surfaceStyle });

    expect(result.failureCode).toBeUndefined();
    expect(result.artifact).toMatchObject({
      version: 'v2',
      entryPath: entry,
      filesHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
      diagnostics: [],
      sourceMap: expect.any(String),
    });
    expect(result.artifact.code).toContain(expectedCode);
  });

  it.each([
    {
      name: 'syntax error',
      files: [{ path: 'index.ts', content: 'const value = ;' }],
      entry: 'index.ts',
      failureCode: 'RUNJS_COMPILE_FAILED',
    },
    {
      name: 'missing import',
      files: [{ path: 'index.ts', content: "import value from './missing'; return value;" }],
      entry: 'index.ts',
      failureCode: 'RUNJS_IMPORT_NOT_FOUND',
    },
    {
      name: 'package import',
      files: [{ path: 'index.ts', content: "import React from 'react'; return React;" }],
      entry: 'index.ts',
      failureCode: 'RUNJS_IMPORT_NOT_ALLOWED',
    },
    {
      name: 'circular dependency',
      files: [
        { path: 'index.ts', content: "import './shared'; return 1;" },
        { path: 'shared.ts', content: "import './index'; export const value = 1;" },
      ],
      entry: 'index.ts',
      failureCode: 'RUNJS_COMPILE_FAILED',
    },
  ])('keeps $name diagnostics stable', ({ files, entry, failureCode }) => {
    const result = compileRunJSSourceWorkspace({ files, entry, surfaceStyle: 'value' });

    expect(result.failureCode).toBe(failureCode);
    expect(result.artifact.diagnostics[0]).toMatchObject({
      severity: 'error',
      code: expect.any(String),
      message: expect.any(String),
    });
    expect(
      result.artifact.diagnostics.map(({ code, path, line, column, message }) => ({
        code,
        path,
        line,
        column,
        message,
      })),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: failureCode,
          path: expect.any(String),
          message: expect.any(String),
        }),
      ]),
    );
  });
});
