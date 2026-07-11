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
import type { RunJSCompileDiagnostic } from '../../../../shared/runjs-source-types';

describe('compileRunJSSourceWorkspace', () => {
  it('compiles named imports and exports into one RunJS artifact', () => {
    const result = compileRunJSSourceWorkspace({
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
    expect(result.artifact.code).toContain("const message = 'Hello';");
    expect(result.artifact.code).toContain('ctx.render(<div>{message}</div>);');
    expect(result.artifact.code).not.toContain('import ');
    expect(result.artifact.code).not.toContain('export ');
  });

  it('emits a debug line map for runtime stack mapping', () => {
    const result = compileRunJSSourceWorkspace({
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

  it('keeps runtime line mappings aligned after TypeScript-only lines are erased', () => {
    const result = compileRunJSSourceWorkspace({
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

  it('compiles default exports and default imports', () => {
    const result = compileRunJSSourceWorkspace({
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
    expect(result.artifact.code).toContain('function getMessage()');
    expect(result.artifact.code).toContain('const getMessage = __runjs_module_');
    expect(result.artifact.code).toContain('.default;');
  });

  it('resolves directory index imports', () => {
    const result = compileRunJSSourceWorkspace({
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
    expect(result.artifact.code).toContain("const message = 'Hello';");
  });

  it('keeps empty named imports as side-effect imports', () => {
    const result = compileRunJSSourceWorkspace({
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
    expect(result.artifact.code).toContain("globalThis.sideEffect = 'ready';");
  });

  it('compiles anonymous async default function exports', () => {
    const result = compileRunJSSourceWorkspace({
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
    expect(result.artifact.code).toContain('async function ()');
    expect(result.artifact.code).not.toContain('export default');
  });

  it('reports missing relative imports with source location', () => {
    const result = compileRunJSSourceWorkspace({
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

  it('rejects package imports and dynamic imports', () => {
    const packageImport = compileRunJSSourceWorkspace({
      entry: 'src/main.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'action',
      files: [
        {
          path: 'src/main.ts',
          content: "import lodash from 'lodash';\nctx.message.info(lodash);",
        },
      ],
    });
    const dynamicImport = compileRunJSSourceWorkspace({
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

  it('rejects CommonJS require calls', () => {
    const blockedSpecifiers = ['fs', 'node:fs', 'lodash'];

    for (const specifier of blockedSpecifiers) {
      const result = compileRunJSSourceWorkspace({
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

  it('rejects CommonJS require aliases and properties on workflow surfaces', () => {
    const blockedSources = [
      "const r = require;\nconst fs = r('fs');\nreturn Boolean(fs);",
      "const fs = globalThis.require('fs');\nreturn Boolean(fs);",
      "const fs = module.require('fs');\nreturn Boolean(fs);",
    ];

    for (const content of blockedSources) {
      const result = compileRunJSSourceWorkspace({
        entry: 'src/main.js',
        runtimeVersion: 'workflow-js',
        surfaceStyle: 'workflow',
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

  it('rejects CommonJS export assignments', () => {
    const blockedSources = [
      {
        surfaceStyle: 'action' as const,
        content: 'module.exports = { value: 1 };\nctx.message.info("done");',
      },
      {
        surfaceStyle: 'workflow' as const,
        content: 'exports.value = 1;\nreturn exports.value;',
      },
      {
        surfaceStyle: 'action' as const,
        content: 'module["exports"] = { value: 1 };\nctx.message.info("done");',
      },
      {
        surfaceStyle: 'workflow' as const,
        content: 'module["exports"].value = 1;\nreturn module["exports"].value;',
      },
      {
        surfaceStyle: 'action' as const,
        content: 'exports.value += 1;\nctx.message.info("done");',
      },
      {
        surfaceStyle: 'workflow' as const,
        content: 'exports.value++;\nreturn exports.value;',
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
        surfaceStyle: 'workflow' as const,
        content: 'globalThis.module.exports = { value: 1 };\nreturn true;',
      },
      {
        surfaceStyle: 'action' as const,
        content: 'globalThis.exports.value = 1;\nctx.message.info("done");',
      },
      {
        surfaceStyle: 'workflow' as const,
        content: 'const m = module;\nm.exports = { value: 1 };\nreturn true;',
      },
      {
        surfaceStyle: 'action' as const,
        content: 'const e = globalThis["exports"];\ne.value = 1;\nctx.message.info("done");',
      },
    ];

    for (const source of blockedSources) {
      const result = compileRunJSSourceWorkspace({
        entry: 'src/main.js',
        runtimeVersion: source.surfaceStyle === 'workflow' ? 'workflow-js' : 'v2',
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

  it('rejects mutable named exports because imports are not live bindings', () => {
    const result = compileRunJSSourceWorkspace({
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

    expect(result.failureCode).toBe('RUNJS_COMPILE_FAILED');
    expect(result.artifact.code).toBe('');
    expect(result.artifact.diagnostics[0]).toMatchObject({
      code: 'RUNJS_COMPILE_FAILED',
      path: 'src/counter.ts',
      message: 'Only exported const variable declarations are supported in RunJS modules',
    });
  });

  it('rejects top-level returns in imported modules', () => {
    const result = compileRunJSSourceWorkspace({
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
      message: 'Top-level return is only supported in the RunJS entry module',
    });
  });

  it('supports JSON default and named imports', () => {
    const result = compileRunJSSourceWorkspace({
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
    expect(result.artifact.code).toContain('__runjs_exports.default =');
    expect(result.artifact.code).toContain('const title = __runjs_module_');
    expect(result.artifact.code).toContain('.default.title;');
  });

  it('returns diagnostics for circular imports and unsupported export forms', () => {
    const circular = compileRunJSSourceWorkspace({
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
    const unsupportedExport = compileRunJSSourceWorkspace({
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

    expect(circular.failureCode).toBe('RUNJS_COMPILE_FAILED');
    expect(circular.artifact.code).toBe('');
    expect(unsupportedExport.failureCode).toBe('RUNJS_COMPILE_FAILED');
    expect(unsupportedExport.artifact.code).toBe('');
    expect(unsupportedExport.artifact.diagnostics[0].message).toContain('Export lists and re-exports');
  });

  it('keeps workflow artifacts out of browser authoring inspection', () => {
    const diagnostics: RunJSCompileDiagnostic[] = [
      {
        severity: 'error',
        code: 'RUNJS_COMPILE_FAILED',
        message: 'browser validation should not run',
      },
    ];
    const result = compileRunJSSourceWorkspace({
      entry: 'src/main.js',
      runtimeVersion: 'workflow-js',
      surfaceStyle: 'workflow',
      inspectAuthoring: () => diagnostics,
      files: [
        {
          path: 'src/main.js',
          content: 'return input.value;',
        },
      ],
    });

    expect(result.failureCode).toBeUndefined();
    expect(result.artifact.version).toBe('workflow-js');
    expect(result.artifact.diagnostics).toEqual([]);
  });

  it('reports workflow syntax errors after module transform', () => {
    const result = compileRunJSSourceWorkspace({
      entry: 'src/main.js',
      runtimeVersion: 'workflow-js',
      surfaceStyle: 'workflow',
      files: [
        {
          path: 'src/main.js',
          content: "import { value as duplicate } from './helper';\nconst duplicate = 2;\nreturn duplicate;",
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
    expect(result.artifact.diagnostics[0].message).toContain('invalid syntax');
  });

  it('reports browser surface syntax errors after module transform', () => {
    const result = compileRunJSSourceWorkspace({
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
    expect(result.artifact.diagnostics[0].message).toContain('invalid syntax');
  });

  it('adds authoring diagnostics for browser surfaces', () => {
    const result = compileRunJSSourceWorkspace({
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

  it('rejects unknown runtime globals in the compiler layer', () => {
    const result = compileRunJSSourceWorkspace({
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

  it('accepts local bindings, imports, type-only names, and chart event globals', () => {
    const localBindings = compileRunJSSourceWorkspace({
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
    const chartEvents = compileRunJSSourceWorkspace({
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

    expect(localBindings.failureCode).toBeUndefined();
    expect(localBindings.artifact.diagnostics).toEqual([]);
    expect(chartEvents.failureCode).toBeUndefined();
    expect(chartEvents.artifact.diagnostics).toEqual([]);
  });

  it('enforces value and render surface contracts without Flow Surface validation', () => {
    const invalidValue = compileRunJSSourceWorkspace({
      entry: 'src/main.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'value',
      files: [{ path: 'src/main.ts', content: 'ctx.render(null);' }],
    });
    const invalidRender = compileRunJSSourceWorkspace({
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
