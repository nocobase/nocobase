/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { compileRunJSSourceWorkspace, RunJSSourceWorkspaceInspector } from '..';
import { buildRunJSTypeScriptContextDeclaration } from '../../typescript-project';

type AsyncFunctionConstructor = new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;

const asyncFunctionConstructor = Object.getPrototypeOf(async function runJSArtifactTest() {})
  .constructor as AsyncFunctionConstructor;

async function executeArtifact(code: string, ctx: unknown): Promise<unknown> {
  return new asyncFunctionConstructor('ctx', code)(ctx);
}

describe('@nocobase/runjs compiler golden contracts', () => {
  it('keeps the form JS menu provider out of authoring-specific TypeScript declarations', () => {
    const menuProviderDeclaration = buildRunJSTypeScriptContextDeclaration('FormJSFieldItemModel');
    const unknownModelDeclaration = buildRunJSTypeScriptContextDeclaration('UnknownMenuProviderModel');
    const editableFieldDeclaration = buildRunJSTypeScriptContextDeclaration('JSEditableFieldModel');

    expect(menuProviderDeclaration).toBe(unknownModelDeclaration);
    expect(editableFieldDeclaration).not.toBe(menuProviderDeclaration);
    expect(editableFieldDeclaration).toContain(
      'addEventListener(type: string, listener: (event: RunJSUnknownObject) => void): void;',
    );
    expect(editableFieldDeclaration).toContain('setValue(value: unknown): void;');
    expect(editableFieldDeclaration).toContain('runJsSource: RunJSSourceInfo;');
  });

  it('reuses a provided TypeScript inspector across compilations', async () => {
    const sourceInspector = new RunJSSourceWorkspaceInspector();
    try {
      const compile = (label: string) =>
        compileRunJSSourceWorkspace({
          files: [{ path: 'index.tsx', content: `ctx.render(<div>${label}</div>);` }],
          entry: 'index.tsx',
          surfaceStyle: 'render',
          sourceInspector,
        });

      await compile('first');
      const second = await compile('second');

      expect(second.failureCode).toBeUndefined();
      expect(second.artifact.code).toContain('second');
      expect(sourceInspector.getDebugState()).toMatchObject({
        projectCreateCount: 1,
        projectReuseCount: 1,
        projectUpdateCount: 2,
      });
    } finally {
      sourceInspector.dispose();
    }
  });

  it('requires optional values to be narrowed under strict null checking', async () => {
    const invalid = await compileRunJSSourceWorkspace({
      files: [
        {
          path: 'index.ts',
          content: 'type Settings = { title?: string }; const settings: Settings = {}; return settings.title.trim();',
        },
      ],
      entry: 'index.ts',
      surfaceStyle: 'value',
    });
    const valid = await compileRunJSSourceWorkspace({
      files: [
        {
          path: 'index.ts',
          content: 'type Settings = { title?: string }; const settings: Settings = {}; return settings.title?.trim();',
        },
      ],
      entry: 'index.ts',
      surfaceStyle: 'value',
    });

    expect(invalid.failureCode).toBe('RUNJS_COMPILE_FAILED');
    expect(invalid.artifact.diagnostics).toContainEqual(
      expect.objectContaining({ path: 'index.ts', message: expect.stringContaining('possibly') }),
    );
    expect(valid.failureCode, JSON.stringify(valid.artifact.diagnostics, null, 2)).toBeUndefined();
    expect(valid.artifact.diagnostics).toEqual([]);
  });

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
  ])('keeps the $name artifact shape stable', async ({ files, entry, surfaceStyle, expectedCode }) => {
    const result = await compileRunJSSourceWorkspace({ files, entry, surfaceStyle });

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
      failureCode: 'RUNJS_IMPORT_NOT_ALLOWED',
    },
  ])('keeps $name diagnostics stable', async ({ files, entry, failureCode }) => {
    const result = await compileRunJSSourceWorkspace({ files, entry, surfaceStyle: 'value' });

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

  it('maps built-in module imports to ctx.libs at runtime', async () => {
    const useEffect = () => undefined;
    const useState = () => [0, () => undefined] as const;
    const React = {
      createElement: (type: unknown, props: unknown, ...children: unknown[]) => ({ type, props, children }),
      useEffect,
      useState,
    };
    const ReactDOM = { createRoot: () => undefined };
    const rendered: unknown[] = [];
    const result = await compileRunJSSourceWorkspace({
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
    await executeArtifact(result.artifact.code, {
      libs: { React, ReactDOM },
      React,
      render: (value: unknown) => rendered.push(value),
    });
    expect(rendered).toHaveLength(1);
    expect(result.artifact.code).toContain('case "react": return ctx.libs.React;');
    expect(result.artifact.code).toContain('case "react-dom/client": return ctx.libs.ReactDOM;');
    expect(result.artifact.code).not.toContain(`from 'react'`);
  });

  it('treats a named default import as the RunJS ctx library alias', async () => {
    const result = await compileRunJSSourceWorkspace({
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
    const React = { createElement: (type: unknown) => ({ type }) };
    await expect(executeArtifact(result.artifact.code, { libs: { React } })).resolves.toEqual({ type: 'div' });
  });

  it('supports a default import combined with a namespace import', async () => {
    const result = await compileRunJSSourceWorkspace({
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
    const React = { createElement: () => undefined, useEffect: () => undefined };
    const value = await executeArtifact(result.artifact.code, { libs: { React } });
    expect(value).toEqual([React, expect.objectContaining({ default: React, useEffect: React.useEffect })]);
  });

  it.each([
    'react/jsx-runtime',
    'react-dom',
    'dayjs/plugin/utc',
    'lodash/get',
    'node:fs',
    '/absolute/path',
    '__proto__',
    'constructor',
    'toString',
  ])('rejects unsupported module specifier %s', async (specifier) => {
    const result = await compileRunJSSourceWorkspace({
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
  });

  it('rejects relative imports that escape the workspace', async () => {
    const result = await compileRunJSSourceWorkspace({
      files: [{ path: 'index.ts', content: `import value from '../escape'; return value;` }],
      entry: 'index.ts',
      surfaceStyle: 'value',
    });

    expect(result.failureCode).toBe('RUNJS_IMPORT_NOT_ALLOWED');
    expect(result.artifact.diagnostics[0]).toMatchObject({
      code: 'RUNJS_IMPORT_NOT_ALLOWED',
      path: 'index.ts',
      message: expect.stringContaining('escapes the RunJS workspace'),
    });
  });

  it.each([
    ['variable', `import { useEffect } from 'react'; const ctx = {}; return useEffect;`],
    [
      'destructured variable',
      `import { useEffect } from 'react'; const { value: ctx } = { value: 1 }; return useEffect;`,
    ],
    ['import alias', `import { useEffect as ctx } from 'react'; return ctx;`],
    ['function-scoped var', `import { useEffect } from 'react'; if (true) { var ctx = {}; } return useEffect;`],
  ])('allows a top-level ctx runtime binding declared through a %s', async (_kind, content) => {
    const useEffect = () => undefined;
    const result = await compileRunJSSourceWorkspace({
      files: [{ path: 'index.ts', content }],
      entry: 'index.ts',
      surfaceStyle: 'value',
    });

    expect(result.failureCode, JSON.stringify(result.artifact.diagnostics, null, 2)).toBeUndefined();
    await expect(executeArtifact(result.artifact.code, { libs: { React: { useEffect } } })).resolves.toBe(useEffect);
  });

  it('allows a type-only import binding named ctx with built-in imports', async () => {
    const result = await compileRunJSSourceWorkspace({
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
    await expect(
      executeArtifact(result.artifact.code, { libs: { React: { useEffect: () => undefined } } }),
    ).resolves.toEqual(expect.any(Function));
  });

  it('supports helper re-exports and circular ESM dependencies', async () => {
    const result = await compileRunJSSourceWorkspace({
      files: [
        { path: 'index.ts', content: `import { read } from './barrel'; return read();` },
        { path: 'barrel.ts', content: `export { read } from './a';` },
        {
          path: 'a.ts',
          content: `import { suffix } from './b'; export const prefix = 'A'; export function read() { return prefix + suffix(); }`,
        },
        {
          path: 'b.ts',
          content: `import { prefix } from './a'; export function suffix() { return prefix === 'A' ? 'B' : '?'; }`,
        },
      ],
      entry: 'index.ts',
      surfaceStyle: 'value',
    });

    expect(result.failureCode, JSON.stringify(result.artifact.diagnostics, null, 2)).toBeUndefined();
    await expect(executeArtifact(result.artifact.code, { libs: {} })).resolves.toBe('AB');
  });

  it('supports namespace imports and top-level await in the executable entry', async () => {
    const result = await compileRunJSSourceWorkspace({
      files: [
        {
          path: 'index.ts',
          content: `import * as values from './values'; const result = await Promise.resolve(values.answer); return result;`,
        },
        { path: 'values.ts', content: `export const answer = 42;` },
      ],
      entry: 'index.ts',
      surfaceStyle: 'value',
    });

    expect(result.failureCode, JSON.stringify(result.artifact.diagnostics, null, 2)).toBeUndefined();
    await expect(executeArtifact(result.artifact.code, { libs: {} })).resolves.toBe(42);
  });

  it('keeps runtime line mappings aligned after TypeScript-only lines are erased', async () => {
    const result = await compileRunJSSourceWorkspace({
      files: [
        { path: 'index.ts', content: "import { run } from './helper'; run();" },
        {
          path: 'helper.ts',
          content: [
            'type RuntimeOptions = { enabled: boolean };',
            'const options: RuntimeOptions = { enabled: true };',
            'export function run() { if (options.enabled) {',
            '  throw new Error("typed boom");',
            '} }',
          ].join('\n'),
        },
      ],
      entry: 'index.ts',
      surfaceStyle: 'action',
    });

    const sourceMap = JSON.parse(result.artifact.sourceMap || '{}') as {
      generatedCodeLineOffset?: number;
      kind?: string;
      mappings?: Array<{ generatedLine: number; source: string; sourceLine: number }>;
    };
    const throwMapping = sourceMap.mappings?.find(
      (mapping) => mapping.source === 'helper.ts' && mapping.sourceLine === 4,
    );
    expect(sourceMap).toEqual(expect.objectContaining({ generatedCodeLineOffset: 2, kind: 'runjs-line-map' }));
    expect(result.artifact.code).toContain('//# sourceURL=nocobase-runjs://bundle/');
    expect(throwMapping).toBeTruthy();
    expect(result.artifact.code.split('\n')[(throwMapping?.generatedLine || 1) - 1]).toContain('typed boom');
  });

  it('reports missing relative imports with source location', async () => {
    const result = await compileRunJSSourceWorkspace({
      files: [{ path: 'index.ts', content: "import value from './missing'; return value;" }],
      entry: 'index.ts',
      surfaceStyle: 'value',
    });

    expect(result.failureCode).toBe('RUNJS_IMPORT_NOT_FOUND');
    expect(result.artifact.diagnostics[0]).toMatchObject({
      code: 'RUNJS_IMPORT_NOT_FOUND',
      path: 'index.ts',
      line: 1,
      column: 19,
    });
  });

  it.each([
    {
      name: 'directory index imports',
      files: [
        { path: 'index.ts', content: "import { value } from './helpers'; return value;" },
        { path: 'helpers/index.ts', content: "export const value = 'directory';" },
      ],
      expected: 'directory',
    },
    {
      name: 'empty named side-effect imports',
      files: [
        { path: 'index.ts', content: "import {} from './setup'; return globalThis.runJSSideEffect;" },
        { path: 'setup.ts', content: "globalThis.runJSSideEffect = 'side-effect';" },
      ],
      expected: 'side-effect',
    },
    {
      name: 'anonymous async default exports',
      files: [
        { path: 'index.ts', content: "import read from './read'; return await read();" },
        { path: 'read.ts', content: "export default async function () { return 'async-default'; }" },
      ],
      expected: 'async-default',
    },
    {
      name: 'mutable named export live bindings',
      files: [
        { path: 'index.ts', content: "import { count, increment } from './counter'; increment(); return count;" },
        { path: 'counter.ts', content: 'export let count = 0; export function increment() { count += 1; }' },
      ],
      expected: 1,
    },
    {
      name: 'JSON default and named imports',
      files: [
        {
          path: 'index.ts',
          content: "import config, { title } from './config.json'; return `${title}:${config.count}`;",
        },
        { path: 'config.json', content: '{"title":"Dashboard","count":3}' },
      ],
      expected: 'Dashboard:3',
    },
  ])('executes $name', async ({ files, expected }) => {
    const result = await compileRunJSSourceWorkspace({ files, entry: 'index.ts', surfaceStyle: 'value' });

    expect(result.failureCode, JSON.stringify(result.artifact.diagnostics, null, 2)).toBeUndefined();
    const value = await executeArtifact(result.artifact.code, { libs: {} });
    delete (globalThis as typeof globalThis & { runJSSideEffect?: string }).runJSSideEffect;
    expect(value).toEqual(expected);
  });

  it.each([
    {
      name: 'dynamic imports',
      files: [
        { path: 'index.ts', content: "return await import('./helper');" },
        { path: 'helper.ts', content: 'export const value = 1;' },
      ],
      failureCode: 'RUNJS_DYNAMIC_IMPORT_UNSUPPORTED',
    },
    {
      name: 'top-level returns in imported modules',
      files: [
        { path: 'index.ts', content: "import { value } from './helper'; return value;" },
        { path: 'helper.ts', content: 'return 1; export const value = 2;' },
      ],
      failureCode: 'RUNJS_COMPILE_FAILED',
      message: 'Top-level return',
    },
  ])('rejects $name', async ({ files, failureCode, message }) => {
    const result = await compileRunJSSourceWorkspace({ files, entry: 'index.ts', surfaceStyle: 'value' });

    expect(result.failureCode).toBe(failureCode);
    if (message) expect(result.artifact.diagnostics[0]?.message).toContain(message);
  });

  it('reports syntax errors after module transform', async () => {
    const result = await compileRunJSSourceWorkspace({
      files: [
        {
          path: 'index.js',
          content: "import { value as duplicate } from './helper'; const duplicate = 2; return duplicate;",
        },
        { path: 'helper.js', content: 'export const value = 1;' },
      ],
      entry: 'index.js',
      surfaceStyle: 'action',
    });

    expect(result.failureCode).toBe('RUNJS_COMPILE_FAILED');
    expect(result.artifact.diagnostics[0]).toMatchObject({ code: 'RUNJS_COMPILE_FAILED', path: 'index.js' });
    expect(result.artifact.diagnostics[0]?.message).toContain('already been declared');
  });

  it('applies injected authoring diagnostics', async () => {
    const inspectAuthoring = () => [
      {
        severity: 'error' as const,
        code: 'RUNJS_COMPILE_FAILED',
        ruleId: 'custom-authoring-rule',
        path: 'index.ts',
        line: 1,
        column: 1,
        message: 'custom authoring validation failed',
      },
    ];
    const browser = await compileRunJSSourceWorkspace({
      files: [{ path: 'index.ts', content: 'return 1;' }],
      entry: 'index.ts',
      inspectAuthoring,
      surfaceStyle: 'value',
    });
    expect(browser.artifact.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ ruleId: 'custom-authoring-rule' })]),
    );
  });

  it('enforces runtime globals and value/render surface contracts', async () => {
    const unknownGlobal = await compileRunJSSourceWorkspace({
      files: [{ path: 'index.ts', content: 'return missingRuntimeValue;' }],
      entry: 'index.ts',
      surfaceStyle: 'value',
    });
    const invalidValue = await compileRunJSSourceWorkspace({
      files: [{ path: 'index.ts', content: 'ctx.render(null);' }],
      entry: 'index.ts',
      surfaceStyle: 'value',
    });
    const invalidRender = await compileRunJSSourceWorkspace({
      files: [{ path: 'index.tsx', content: 'const value = 1;' }],
      entry: 'index.tsx',
      surfaceStyle: 'render',
    });

    expect(unknownGlobal.artifact.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ ruleId: 'runjs-global-unknown' })]),
    );
    expect(invalidValue.artifact.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: 'runjs-value-render-forbidden' }),
        expect.objectContaining({ ruleId: 'runjs-value-return-required' }),
      ]),
    );
    expect(invalidRender.artifact.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ ruleId: 'runjs-render-required' })]),
    );
  });

  it('accepts local and imported globals while rejecting missing type names', async () => {
    const localBindings = await compileRunJSSourceWorkspace({
      files: [
        {
          path: 'index.tsx',
          content: [
            "import { label } from './label';",
            'type Options = Record<string, MissingType>;',
            'const renderLabel = (suffix: string) => `${label}${suffix}`;',
            'ctx.render(<div>{renderLabel("!")}</div>);',
          ].join('\n'),
        },
        { path: 'label.ts', content: "export const label = 'Ready';" },
      ],
      entry: 'index.tsx',
      surfaceStyle: 'render',
    });
    expect(localBindings.artifact.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-global-unknown',
          message: expect.stringContaining("Cannot find name 'MissingType'"),
        }),
      ]),
    );
  });

  it('uses TypeScript semantic diagnostics as a backend compile gate', async () => {
    const result = await compileRunJSSourceWorkspace({
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

  it('applies the RunJS authoring diagnostic policy at the compiler gate', async () => {
    const unknownValue = await compileRunJSSourceWorkspace({
      files: [
        {
          path: 'index.ts',
          content: "const response = await ctx.api.request({ url: 'users:list' }); response?.data?.data;",
        },
      ],
      entry: 'index.ts',
      surfaceStyle: 'action',
    });
    const invalidMember = await compileRunJSSourceWorkspace({
      files: [{ path: 'index.ts', content: "const record = { status: 'unknown' as const }; record.missing;" }],
      entry: 'index.ts',
      surfaceStyle: 'action',
    });
    const ordinaryTypeErrors = await compileRunJSSourceWorkspace({
      files: [
        {
          path: 'index.ts',
          content:
            "const count: number = 'wrong'; const unknownValue: unknown = {}; const countFromUnknown: number = unknownValue; const value: { name: string } | { email: string } = Math.random() ? { name: 'A' } : { email: 'a@example.com' }; value.name;",
        },
      ],
      entry: 'index.ts',
      surfaceStyle: 'action',
    });
    const reactGlobal = await compileRunJSSourceWorkspace({
      files: [{ path: 'index.tsx', content: 'React.useState(0);' }],
      entry: 'index.tsx',
      surfaceStyle: 'action',
    });
    const reactTypeNamespace = await compileRunJSSourceWorkspace({
      files: [{ path: 'index.tsx', content: 'const node: React.ReactNode = null; return node;' }],
      entry: 'index.tsx',
      surfaceStyle: 'action',
    });
    const suppression = await compileRunJSSourceWorkspace({
      files: [{ path: 'index.ts', content: "// @ts-nocheck\nconst count: number = 'wrong';" }],
      entry: 'index.ts',
      surfaceStyle: 'action',
    });

    expect(unknownValue.failureCode).toBeUndefined();
    expect(unknownValue.artifact.diagnostics).toEqual([]);
    expect(invalidMember.artifact.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('missing') })]),
    );
    expect(ordinaryTypeErrors.artifact.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining("Type 'string' is not assignable to type 'number'"),
        }),
        expect.objectContaining({
          message: expect.stringContaining("Type 'unknown' is not assignable to type 'number'"),
        }),
        expect.objectContaining({ message: expect.stringContaining("Property 'name' does not exist on type") }),
      ]),
    );
    expect(reactGlobal.artifact.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('ctx.libs.React') })]),
    );
    expect(reactTypeNamespace.artifact.diagnostics).toEqual([]);
    expect(suppression.failureCode).toBe('RUNJS_COMPILE_FAILED');
    expect(suppression.artifact.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ ruleId: 'runjs-typescript-directive-forbidden' })]),
    );
  });

  it('keeps runtime-injected libraries permissive for ordinary authoring patterns', async () => {
    const result = await compileRunJSSourceWorkspace({
      files: [
        {
          path: 'index.tsx',
          content: `
const React = ctx.libs.React;
const dayjs = ctx.libs.dayjs;
const Card = ctx.libs.antd.Card;
type FormFieldProps = { field: { name: string } };
const FormField = (_props: FormFieldProps) => null;
const state = React.useState(0);
const [records, setRecords] = React.useState<Record<string, unknown>[]>([]);
const load = React.useCallback(async (page: number) => page + records.length, [records]);
React.useEffect(() => {
  setRecords((current) => current);
}, [load]);
const total = React.useMemo(() => records.length, [records]);
const dailyMap = {};
const key = dayjs().format('YYYY-MM-DD');
dailyMap[key] = state[0] + 1;
const previousCursor = document.body.style.cursor;
document.body.style.cursor = 'col-resize';
let animationFrame: number | null = null;
const onPointerMove = (event: PointerEvent) => {
  animationFrame = window.requestAnimationFrame(() => event.clientX);
};
document.addEventListener('pointermove', onPointerMove);
if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
document.body.style.cursor = previousCursor;
ctx.render(
  <Card>
    <FormField key="name" field={{ name: 'name' }} />
    {dailyMap[key] > 0 ? String(dailyMap[key] + total) : '-'}
  </Card>,
);
`,
        },
      ],
      entry: 'index.tsx',
      surfaceStyle: 'render',
    });

    expect(result.failureCode).toBeUndefined();
    expect(result.artifact.diagnostics).toEqual([]);
  });

  it('uses standard DOM and React JSX types without exposing new runtime globals', async () => {
    const typedBrowserApis = await compileRunJSSourceWorkspace({
      files: [
        {
          path: 'index.tsx',
          content: `
type ItemProps = { label: string };
interface PointerWithLabel extends PointerEvent { label?: string }
const Item = ({ label }: ItemProps) => <div>{label}</div>;
const handlePointerMove = (event: PointerEvent) => event.pointerId;
document.body.style.cursor = 'grabbing';
document.body.style.userSelect = 'none';
const animationFrameId: number = window.requestAnimationFrame(() => handlePointerMove);
ctx.render(<Item key="item-1" label={String(animationFrameId)} />);
`,
        },
      ],
      entry: 'index.tsx',
      surfaceStyle: 'render',
    });
    const barePointerEvent = await compileRunJSSourceWorkspace({
      files: [{ path: 'index.ts', content: `new PointerEvent('pointermove');` }],
      entry: 'index.ts',
      surfaceStyle: 'action',
    });
    const bareDomBaseClass = await compileRunJSSourceWorkspace({
      files: [{ path: 'index.ts', content: `class CustomElement extends HTMLElement {}` }],
      entry: 'index.ts',
      surfaceStyle: 'action',
    });

    expect(
      typedBrowserApis.failureCode,
      JSON.stringify(typedBrowserApis.artifact.diagnostics, null, 2),
    ).toBeUndefined();
    expect(typedBrowserApis.artifact.diagnostics).toEqual([]);
    expect(barePointerEvent.artifact.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-global-unknown',
          message: expect.stringContaining("Cannot find name 'PointerEvent'"),
        }),
      ]),
    );
    expect(bareDomBaseClass.artifact.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-global-unknown',
          message: expect.stringContaining("Cannot find name 'HTMLElement'"),
        }),
      ]),
    );
  });

  it('accepts browser APIs through the runtime window proxy while keeping bare globals restricted', async () => {
    const windowResult = await compileRunJSSourceWorkspace({
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

    const bareGlobalResult = await compileRunJSSourceWorkspace({
      files: [{ path: 'index.ts', content: `new File(['hello'], 'hello.txt');` }],
      entry: 'index.ts',
      surfaceStyle: 'action',
    });
    expect(bareGlobalResult.artifact.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-global-unknown',
          message: expect.stringContaining("Cannot find name 'File'"),
        }),
      ]),
    );
  });
});
