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

    expect(result.failureCode, JSON.stringify(result.artifact.diagnostics, null, 2)).toBeUndefined();
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
      name: 'unsupported package import',
      files: [{ path: 'index.ts', content: "import value from 'unsupported-package'; return value;" }],
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

  it('rewrites built-in module imports to ctx.libs declarations', () => {
    const result = compileRunJSSourceWorkspace({
      files: [
        {
          path: 'index.tsx',
          content: [
            `import React, { useEffect, useState as useLocalState } from 'react';`,
            `import * as ReactDOM from 'react-dom/client';`,
            `useEffect(() => undefined, []);`,
            `ctx.render(<div>{String(React && ReactDOM && useLocalState)}</div>);`,
          ].join('\n'),
        },
      ],
      entry: 'index.tsx',
      surfaceStyle: 'render',
    });

    expect(result.failureCode, JSON.stringify(result.artifact.diagnostics, null, 2)).toBeUndefined();
    expect(result.artifact.diagnostics).toEqual([]);
    expect(result.artifact.code).toContain('const React = ctx.libs.React;');
    expect(result.artifact.code).toContain('const { useEffect, useState: useLocalState } = ctx.libs.React;');
    expect(result.artifact.code).toContain('const ReactDOM = ctx.libs.ReactDOM;');
    expect(result.artifact.code).not.toContain(`from 'react'`);
  });

  it('treats a named default import as the RunJS ctx library alias', () => {
    const result = compileRunJSSourceWorkspace({
      files: [
        {
          path: 'index.ts',
          content: `import { default as ReactAlias } from 'react'; return ReactAlias.createElement('div');`,
        },
      ],
      entry: 'index.ts',
      surfaceStyle: 'value',
    });

    expect(result.failureCode, JSON.stringify(result.artifact.diagnostics, null, 2)).toBeUndefined();
    expect(result.artifact.code).toContain('const ReactAlias = ctx.libs.React;');
    expect(result.artifact.code).not.toContain('{ default: ReactAlias }');
  });

  it('supports a default import combined with a namespace import', () => {
    const result = compileRunJSSourceWorkspace({
      files: [
        {
          path: 'index.ts',
          content: `import React, * as ReactNS from 'react'; return [React, ReactNS];`,
        },
      ],
      entry: 'index.ts',
      surfaceStyle: 'value',
    });

    expect(result.failureCode, JSON.stringify(result.artifact.diagnostics, null, 2)).toBeUndefined();
    expect(result.artifact.code).toContain('const React = ctx.libs.React;');
    expect(result.artifact.code).toContain('const ReactNS = ctx.libs.React;');
  });

  it.each(['react/jsx-runtime', 'react-dom', 'dayjs/plugin/utc', 'lodash/get', '__proto__', 'constructor', 'toString'])(
    'rejects unsupported module specifier %s',
    (specifier) => {
      const result = compileRunJSSourceWorkspace({
        files: [{ path: 'index.ts', content: `import value from '${specifier}'; return value;` }],
        entry: 'index.ts',
        surfaceStyle: 'value',
      });

      expect(result.failureCode).toBe('RUNJS_IMPORT_NOT_ALLOWED');
      expect(result.artifact.diagnostics).toContainEqual(
        expect.objectContaining({
          code: 'RUNJS_IMPORT_NOT_ALLOWED',
          message: `Import "${specifier}" is not allowed`,
        }),
      );
    },
  );

  it.each([
    ['variable', `import { useEffect } from 'react'; const ctx = {}; return useEffect;`],
    [
      'destructured variable',
      `import { useEffect } from 'react'; const { value: ctx } = { value: 1 }; return useEffect;`,
    ],
    ['import alias', `import { useEffect as ctx } from 'react'; return ctx;`],
    ['function-scoped var', `import { useEffect } from 'react'; if (true) { var ctx = {}; } return useEffect;`],
  ])('rejects a top-level ctx runtime binding declared through a %s', (_kind, content) => {
    const result = compileRunJSSourceWorkspace({
      files: [{ path: 'index.ts', content }],
      entry: 'index.ts',
      surfaceStyle: 'value',
    });

    expect(result.failureCode).toBe('RUNJS_COMPILE_FAILED');
    expect(result.artifact.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'RUNJS_COMPILE_FAILED',
        message: expect.stringContaining('top-level "ctx" runtime binding'),
      }),
    );
    expect(result.artifact.code).toBe('');
  });

  it('allows a type-only import binding named ctx with built-in imports', () => {
    const result = compileRunJSSourceWorkspace({
      files: [
        {
          path: 'index.ts',
          content: [
            `import { type FC as ctx, useEffect } from 'react';`,
            `const Component: ctx = () => null;`,
            `return useEffect && Component;`,
          ].join('\n'),
        },
      ],
      entry: 'index.ts',
      surfaceStyle: 'value',
    });

    expect(result.failureCode, JSON.stringify(result.artifact.diagnostics, null, 2)).toBeUndefined();
    expect(result.artifact.code).toContain('const { useEffect } = ctx.libs.React;');
  });

  it('uses TypeScript semantic diagnostics as a backend compile gate', () => {
    const result = compileRunJSSourceWorkspace({
      files: [{ path: 'index.ts', content: "const count: number = 'invalid';\nreturn count;" }],
      entry: 'index.ts',
      surfaceStyle: 'value',
    });

    expect(result.failureCode).toBe('RUNJS_COMPILE_FAILED');
    expect(result.artifact.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'index.ts',
          ruleId: 'runjs-typescript',
          message: expect.stringContaining("Type 'string' is not assignable to type 'number'"),
          details: expect.objectContaining({ tsCode: 2322 }),
        }),
      ]),
    );
  });

  it('accepts complete browser APIs through window while keeping bare globals restricted', () => {
    const windowResult = compileRunJSSourceWorkspace({
      files: [
        {
          path: 'index.ts',
          content: `
const blob = new window.Blob(['hello']);
const file = new window.File(['hello'], 'hello.txt');
window.URL.createObjectURL(blob);
window.location.assign('/demo');
`,
        },
      ],
      entry: 'index.ts',
      surfaceStyle: 'action',
    });
    expect(windowResult.artifact.diagnostics).toEqual([]);

    const bareGlobalResult = compileRunJSSourceWorkspace({
      files: [{ path: 'index.ts', content: `new File(['hello'], 'hello.txt');` }],
      entry: 'index.ts',
      surfaceStyle: 'action',
    });
    expect(bareGlobalResult.artifact.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-typescript',
          message: expect.stringContaining("'File' only refers to a type"),
          details: expect.objectContaining({ tsCode: 2693 }),
        }),
      ]),
    );
  });
});
