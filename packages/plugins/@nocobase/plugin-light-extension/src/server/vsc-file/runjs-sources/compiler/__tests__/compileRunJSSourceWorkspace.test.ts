/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { compileRunJSSourceWorkspace } from '..';

type AsyncFunctionConstructor = new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;

const asyncFunctionConstructor = Object.getPrototypeOf(async function runJSArtifactTest() {})
  .constructor as AsyncFunctionConstructor;

async function executeArtifact(code: string, ctx: unknown): Promise<unknown> {
  return new asyncFunctionConstructor('ctx', code)(ctx);
}

describe('compileRunJSSourceWorkspace', () => {
  it('compiles named imports and exports into one RunJS artifact', async () => {
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/main.tsx',
      runtimeVersion: 'v2',
      surfaceStyle: 'render',
      files: [
        {
          path: 'src/main.tsx',
          content: "import { message } from './helper';\nctx.render(<div>{message}</div>);",
        },
        {
          path: 'src/helper.ts',
          content: "export const message: string = 'Hello';",
        },
      ],
    });

    expect(result.failureCode).toBeUndefined();
    expect(result.artifact.diagnostics).toEqual([]);
    const rendered: unknown[] = [];
    const React = { createElement: (type: unknown, props: unknown, child: unknown) => ({ type, props, child }) };
    await executeArtifact(result.artifact.code, {
      libs: {},
      React,
      render: (value: unknown) => rendered.push(value),
    });
    expect(rendered).toEqual([{ type: 'div', props: null, child: 'Hello' }]);
    expect(result.artifact.code).not.toContain('import ');
    expect(result.artifact.code).not.toContain('export const message');
  });

  it('emits a debug line map for runtime stack mapping', async () => {
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/main.tsx',
      runtimeVersion: 'v2',
      surfaceStyle: 'action',
      files: [
        {
          path: 'src/main.tsx',
          content: "import { test } from './helper';\ntest();",
        },
        {
          path: 'src/helper.ts',
          content: 'export function test() {\n  throw new Error("boom");\n}',
        },
      ],
    });

    expect(result.failureCode).toBeUndefined();
    expect(result.artifact.sourceMap).toBeTruthy();
    expect(result.artifact.code).toContain('//# sourceURL=nocobase-runjs://bundle/');

    const sourceMap = JSON.parse(result.artifact.sourceMap || '{}') as {
      kind?: string;
      sourceURL?: string;
      generatedCodeLineOffset?: number;
      mappings?: Array<{ source: string; sourceLine: number; generatedLine: number }>;
    };
    expect(sourceMap.kind).toBe('runjs-line-map');
    expect(sourceMap.sourceURL).toMatch(/^nocobase-runjs:\/\/bundle\//);
    expect(sourceMap.generatedCodeLineOffset).toBe(2);
    expect(sourceMap.mappings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'src/helper.ts',
          sourceLine: 2,
        }),
      ]),
    );
    const throwMapping = sourceMap.mappings?.find(
      (mapping) => mapping.source === 'src/helper.ts' && mapping.sourceLine === 2,
    );
    expect(throwMapping).toBeTruthy();
    expect(result.artifact.code.split('\n')[(throwMapping?.generatedLine || 1) - 1]).toContain('throw new Error');
  });

  it('keeps runtime line mappings aligned after TypeScript-only lines are erased', async () => {
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/main.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'action',
      files: [
        {
          path: 'src/main.ts',
          content: [
            'type RuntimeOptions = { enabled: boolean };',
            'const options: RuntimeOptions = { enabled: true };',
            'if (options.enabled) {',
            '  throw new Error("typed boom");',
            '}',
          ].join('\n'),
        },
      ],
    });

    expect(result.failureCode).toBeUndefined();
    const sourceMap = JSON.parse(result.artifact.sourceMap || '{}') as {
      mappings?: Array<{ source: string; sourceLine: number; generatedLine: number }>;
    };
    const throwMapping = sourceMap.mappings?.find(
      (mapping) => mapping.source === 'src/main.ts' && mapping.sourceLine === 4,
    );

    expect(throwMapping).toBeTruthy();
    expect(result.artifact.code.split('\n')[(throwMapping?.generatedLine || 1) - 1]).toContain(
      'throw new Error("typed boom")',
    );
  });

  it('compiles default exports and default imports', async () => {
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/main.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'action',
      files: [
        {
          path: 'src/main.ts',
          content: "import getMessage from './message';\nctx.message.info(getMessage());",
        },
        {
          path: 'src/message.ts',
          content: "export default function getMessage() { return 'Hello'; }",
        },
      ],
    });

    expect(result.failureCode).toBeUndefined();
    expect(result.artifact.diagnostics).toEqual([]);
    const messages: unknown[] = [];
    await executeArtifact(result.artifact.code, {
      libs: {},
      message: { info: (value: unknown) => messages.push(value) },
    });
    expect(messages).toEqual(['Hello']);
  });

  it('resolves directory index imports', async () => {
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/main.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'action',
      files: [
        {
          path: 'src/main.ts',
          content: "import { message } from './helpers';\nctx.message.info(message);",
        },
        {
          path: 'src/helpers/index.ts',
          content: "export const message = 'Hello';",
        },
      ],
    });

    expect(result.failureCode).toBeUndefined();
    expect(result.artifact.diagnostics).toEqual([]);
    const messages: unknown[] = [];
    await executeArtifact(result.artifact.code, {
      libs: {},
      message: { info: (value: unknown) => messages.push(value) },
    });
    expect(messages).toEqual(['Hello']);
  });

  it('keeps empty named imports as side-effect imports', async () => {
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/main.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'render',
      files: [
        {
          path: 'src/main.ts',
          content: "import {} from './setup';\nctx.render(globalThis.sideEffect);",
        },
        {
          path: 'src/setup.ts',
          content: "globalThis.sideEffect = 'ready';",
        },
      ],
    });

    expect(result.failureCode).toBeUndefined();
    expect(result.artifact.diagnostics).toEqual([]);
    const runtimeGlobal = globalThis as typeof globalThis & { sideEffect?: string };
    delete runtimeGlobal.sideEffect;
    const rendered: unknown[] = [];
    await executeArtifact(result.artifact.code, {
      libs: {},
      render: (value: unknown) => rendered.push(value),
    });
    expect(rendered).toEqual(['ready']);
    delete runtimeGlobal.sideEffect;
  });

  it('compiles anonymous async default function exports', async () => {
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/main.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'action',
      files: [
        {
          path: 'src/main.ts',
          content: "import getMessage from './message';\nctx.message.info(getMessage);",
        },
        {
          path: 'src/message.ts',
          content: "export default async function () { return 'Hello'; }",
        },
      ],
    });

    expect(result.failureCode).toBeUndefined();
    expect(result.artifact.diagnostics).toEqual([]);
    const messages: unknown[] = [];
    await executeArtifact(result.artifact.code, {
      libs: {},
      message: { info: (value: unknown) => messages.push(value) },
    });
    expect(messages[0]).toEqual(expect.any(Function));
    await expect((messages[0] as () => Promise<string>)()).resolves.toBe('Hello');
  });

  it('reports missing relative imports with source location', async () => {
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/main.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'action',
      files: [
        {
          path: 'src/main.ts',
          content: "import { message } from './missing';\nctx.message.info(message);",
        },
      ],
    });

    expect(result.failureCode).toBe('RUNJS_IMPORT_NOT_FOUND');
    expect(result.artifact.code).toBe('');
    expect(result.artifact.diagnostics[0]).toMatchObject({
      code: 'RUNJS_IMPORT_NOT_FOUND',
      path: 'src/main.ts',
      line: 1,
      column: 25,
    });
  });

  it('rejects package imports and dynamic imports', async () => {
    const packageImport = await compileRunJSSourceWorkspace({
      entry: 'src/main.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'action',
      files: [
        {
          path: 'src/main.ts',
          content: "import value from 'unsupported-package';\nctx.message.info(value);",
        },
      ],
    });
    const dynamicImport = await compileRunJSSourceWorkspace({
      entry: 'src/main.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'action',
      files: [
        {
          path: 'src/main.ts',
          content: "const helper = await import('./helper');\nctx.message.info(helper);",
        },
        {
          path: 'src/helper.ts',
          content: 'export const helper = true;',
        },
      ],
    });

    expect(packageImport.failureCode).toBe('RUNJS_IMPORT_NOT_ALLOWED');
    expect(dynamicImport.failureCode).toBe('RUNJS_DYNAMIC_IMPORT_UNSUPPORTED');
  });

  it('rejects CommonJS require calls', async () => {
    const blockedSpecifiers = ['fs', 'node:fs', 'lodash'];

    for (const specifier of blockedSpecifiers) {
      const result = await compileRunJSSourceWorkspace({
        entry: 'src/main.ts',
        runtimeVersion: 'v2',
        surfaceStyle: 'action',
        files: [
          {
            path: 'src/main.ts',
            content: `const imported = require('${specifier}');\nctx.message.info(imported);`,
          },
        ],
      });

      expect(result.failureCode).toBe('RUNJS_IMPORT_NOT_ALLOWED');
      expect(result.artifact.code).toBe('');
      expect(result.artifact.diagnostics[0]).toMatchObject({
        code: 'RUNJS_IMPORT_NOT_ALLOWED',
        path: 'src/main.ts',
        line: 1,
        column: 18,
      });
    }
  });

  it('rejects CommonJS require aliases and properties', async () => {
    const blockedSources = [
      "const r = require;\nconst fs = r('fs');\nreturn Boolean(fs);",
      "const fs = globalThis.require('fs');\nreturn Boolean(fs);",
      "const fs = module.require('fs');\nreturn Boolean(fs);",
    ];

    for (const content of blockedSources) {
      const result = await compileRunJSSourceWorkspace({
        entry: 'src/main.js',
        runtimeVersion: 'v2',
        surfaceStyle: 'action',
        files: [
          {
            path: 'src/main.js',
            content,
          },
        ],
      });

      expect(result.failureCode).toBe('RUNJS_IMPORT_NOT_ALLOWED');
      expect(result.artifact.code).toBe('');
    }
  });

  it('rejects CommonJS export assignments', async () => {
    const blockedSources = [
      {
        surfaceStyle: 'action' as const,
        content: 'module.exports = { value: 1 };\nctx.message.info("done");',
      },
      {
        surfaceStyle: 'action' as const,
        content: 'module["exports"] = { value: 1 };\nctx.message.info("done");',
      },
      {
        surfaceStyle: 'action' as const,
        content: 'exports.value += 1;\nctx.message.info("done");',
      },
      {
        surfaceStyle: 'action' as const,
        content: 'Object.assign(module.exports, { value: 1 });',
      },
      {
        surfaceStyle: 'action' as const,
        content: 'Object.defineProperty(module["exports"], "value", { value: 1 });',
      },
      {
        surfaceStyle: 'action' as const,
        content: 'globalThis.exports.value = 1;\nctx.message.info("done");',
      },
      {
        surfaceStyle: 'action' as const,
        content: 'const e = globalThis["exports"];\ne.value = 1;\nctx.message.info("done");',
      },
    ];

    for (const source of blockedSources) {
      const result = await compileRunJSSourceWorkspace({
        entry: 'src/main.js',
        runtimeVersion: 'v2',
        surfaceStyle: source.surfaceStyle,
        files: [
          {
            path: 'src/main.js',
            content: source.content,
          },
        ],
      });

      expect(result.failureCode).toBe('RUNJS_COMPILE_FAILED');
      expect(result.artifact.code).toBe('');
      expect(result.artifact.diagnostics[0]).toMatchObject({
        code: 'RUNJS_COMPILE_FAILED',
        path: 'src/main.js',
        message: 'CommonJS exports are not supported in RunJS modules',
      });
    }
  });

  it('supports mutable named exports with live bindings', async () => {
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/main.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'action',
      files: [
        {
          path: 'src/main.ts',
          content: "import { count, increment } from './counter';\nincrement();\nctx.message.info(count);",
        },
        {
          path: 'src/counter.ts',
          content: 'export let count = 0;\nexport function increment() { count += 1; }',
        },
      ],
    });

    expect(result.failureCode, JSON.stringify(result.artifact.diagnostics, null, 2)).toBeUndefined();
    const messages: unknown[] = [];
    await executeArtifact(result.artifact.code, {
      libs: {},
      message: { info: (value: unknown) => messages.push(value) },
    });
    expect(messages).toEqual([1]);
  });

  it('rejects top-level returns in imported modules', async () => {
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/main.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'action',
      files: [
        {
          path: 'src/main.ts',
          content: "import { value } from './helper';\nctx.message.info(value);",
        },
        {
          path: 'src/helper.ts',
          content: 'return 1;\nexport const value = 2;',
        },
      ],
    });

    expect(result.failureCode).toBe('RUNJS_COMPILE_FAILED');
    expect(result.artifact.code).toBe('');
    expect(result.artifact.diagnostics[0]).toMatchObject({
      code: 'RUNJS_COMPILE_FAILED',
      path: 'src/helper.ts',
      message: expect.stringContaining('Top-level return'),
    });
  });

  it('supports JSON default and named imports', async () => {
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/main.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'value',
      files: [
        {
          path: 'src/main.ts',
          content: "import config, { title } from './config.json';\nreturn `${title}:${config.count}`;",
        },
        {
          path: 'src/config.json',
          content: JSON.stringify({ title: 'Dashboard', count: 3 }),
        },
      ],
    });

    expect(result.failureCode).toBeUndefined();
    await expect(executeArtifact(result.artifact.code, { libs: {} })).resolves.toBe('Dashboard:3');
  });

  it('rejects imports back into the entry while accepting standard re-exports', async () => {
    const circular = await compileRunJSSourceWorkspace({
      entry: 'src/a.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'action',
      files: [
        {
          path: 'src/a.ts',
          content: "import { b } from './b';\nctx.message.info(b);",
        },
        {
          path: 'src/b.ts',
          content: "import { a } from './a';\nexport const b = a;",
        },
      ],
    });
    const unsupportedExport = await compileRunJSSourceWorkspace({
      entry: 'src/main.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'action',
      files: [
        {
          path: 'src/main.ts',
          content: "export * from './helper';",
        },
        {
          path: 'src/helper.ts',
          content: 'export const helper = true;',
        },
      ],
    });

    expect(circular.failureCode).toBe('RUNJS_IMPORT_NOT_ALLOWED');
    expect(circular.artifact.code).toBe('');
    expect(
      unsupportedExport.failureCode,
      JSON.stringify(unsupportedExport.artifact.diagnostics, null, 2),
    ).toBeUndefined();
  });

  it('reports browser surface syntax errors after module transform', async () => {
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/main.js',
      runtimeVersion: 'v2',
      surfaceStyle: 'action',
      files: [
        {
          path: 'src/main.js',
          content: "import { value as duplicate } from './helper';\nconst duplicate = 2;\nctx.message.info(duplicate);",
        },
        {
          path: 'src/helper.js',
          content: 'export const value = 1;',
        },
      ],
    });

    expect(result.failureCode).toBe('RUNJS_COMPILE_FAILED');
    expect(result.artifact.diagnostics[0]).toMatchObject({
      code: 'RUNJS_COMPILE_FAILED',
      path: 'src/main.js',
    });
    expect(result.artifact.diagnostics[0].message).toContain('already been declared');
  });

  it('adds authoring diagnostics for browser surfaces', async () => {
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/main.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'action',
      inspectAuthoring: () => [
        {
          severity: 'error',
          code: 'RUNJS_COMPILE_FAILED',
          ruleId: 'custom-authoring-rule',
          path: 'src/main.ts',
          line: 1,
          column: 1,
          message: 'custom authoring validation failed',
        },
      ],
      files: [
        {
          path: 'src/main.ts',
          content: 'ctx.message.info("ok");',
        },
      ],
    });

    expect(result.failureCode).toBe('RUNJS_COMPILE_FAILED');
    expect(result.artifact.diagnostics[0]).toMatchObject({
      ruleId: 'custom-authoring-rule',
    });
  });

  it('rejects unknown runtime globals in the compiler layer', async () => {
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/main.tsx',
      runtimeVersion: 'v2',
      surfaceStyle: 'render',
      files: [
        {
          path: 'src/main.tsx',
          content: 'ctx.render(<div>Example</div>);\nsdfsdfw21212 + 1212;',
        },
      ],
    });

    expect(result.failureCode).toBe('RUNJS_COMPILE_FAILED');
    expect(result.artifact.code).toBe('');
    expect(result.artifact.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'RUNJS_COMPILE_FAILED',
          ruleId: 'runjs-global-unknown',
          path: 'src/main.tsx',
          line: 2,
          column: 1,
          details: {
            global: 'sdfsdfw21212',
          },
        }),
      ]),
    );
    expect(result.artifact.diagnostics[0].message).toContain("Cannot find name 'sdfsdfw21212'");
    expect(result.artifact.diagnostics[0].message).not.toContain('flowSurfaces authoring');
  });

  it('accepts local bindings, imports, and chart event globals while rejecting missing type names', async () => {
    const localBindings = await compileRunJSSourceWorkspace({
      entry: 'src/main.tsx',
      runtimeVersion: 'v2',
      surfaceStyle: 'render',
      files: [
        {
          path: 'src/main.tsx',
          content: [
            "import { label } from './label';",
            'type Options = Record<string, MissingType>;',
            'const renderLabel = (suffix: string) => `${label}${suffix}`;',
            'ctx.render(<div>{renderLabel("!")}</div>);',
          ].join('\n'),
        },
        {
          path: 'src/label.ts',
          content: "export const label = 'Ready';",
        },
      ],
    });
    const chartEvents = await compileRunJSSourceWorkspace({
      entry: 'src/main.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'action',
      locator: {
        kind: 'chart.events',
        modelUid: 'chart-model',
      },
      files: [
        {
          path: 'src/main.ts',
          content: "if (params?.name) { chart.off('click'); }",
        },
      ],
    });

    expect(localBindings.failureCode).toBe('RUNJS_COMPILE_FAILED');
    expect(localBindings.artifact.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-global-unknown',
          message: expect.stringContaining("Cannot find name 'MissingType'"),
        }),
      ]),
    );
    expect(chartEvents.failureCode).toBeUndefined();
    expect(chartEvents.artifact.diagnostics).toEqual([]);
  });

  it('enforces value and render surface contracts without Flow Surface validation', async () => {
    const invalidValue = await compileRunJSSourceWorkspace({
      entry: 'src/main.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'value',
      files: [{ path: 'src/main.ts', content: 'ctx.render(null);' }],
    });
    const invalidRender = await compileRunJSSourceWorkspace({
      entry: 'src/main.tsx',
      runtimeVersion: 'v2',
      surfaceStyle: 'render',
      files: [{ path: 'src/main.tsx', content: 'const value = 1;' }],
    });

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
});
