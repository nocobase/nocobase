/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LightExtensionValidator } from '../services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';

describe('path', () => {
  it('accepts js-block entry files under the allowlisted source root', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'export default function SalesKpi() { return null; }\n',
        },
        {
          path: 'src/client/js-blocks/sales-kpi/entry.json',
          content: '{"schemaVersion":1,"key":"sales-kpi","settings":{}}',
        },
        {
          path: 'README.md',
          content: '# demo\n',
        },
      ],
    });

    expect(result.accepted).toBe(true);
    expect(result.entries[0]).toMatchObject({
      kind: 'js-block',
      entryName: 'sales-kpi',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
    });
  });

  it('accepts repo root files and shared helper files', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'README.md',
          content: '# demo\n',
        },
        {
          path: 'light-extension.json',
          content: '{"schemaVersion":1}',
        },
        {
          path: 'tsconfig.json',
          content: '{"compilerOptions":{"strict":true}}',
        },
        {
          path: 'src/shared/format.ts',
          content: 'export function formatValue(value: unknown) { return String(value ?? ""); }\n',
        },
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'import { formatValue } from "../../../shared/format";\nctx.render(formatValue("ok"));\n',
        },
        entryDescriptor(),
      ],
    });

    expect(result.accepted).toBe(true);
    expect(result.diagnostics.filter((item) => item.code === 'path_not_allowed')).toEqual([]);
    expect(result.diagnostics.filter((item) => item.code === 'path_extension_not_allowed')).toEqual([]);
  });

  it('accepts JS Page entry modules without allowing page-specific assets', () => {
    const validator = new LightExtensionValidator();
    const accepted = validator.validateWorkspace({
      files: [
        {
          path: 'src/client/js-pages/orders/index.tsx',
          content: 'import { title } from "./title";\nctx.render(<div>{title}</div>);\n',
        },
        { path: 'src/client/js-pages/orders/title.ts', content: 'export const title = "Orders";\n' },
        {
          path: 'src/client/js-pages/orders/entry.json',
          content: JSON.stringify({ schemaVersion: 1, key: 'orders' }),
        },
      ],
    });
    const rejected = validator.validateWorkspace({
      files: [{ path: 'src/client/js-pages/orders/style.css', content: '.page { min-height: 100vh; }\n' }],
    });

    expect(accepted).toMatchObject({
      accepted: true,
      entries: [
        expect.objectContaining({
          kind: 'js-page',
          entryName: 'orders',
          entryPath: 'src/client/js-pages/orders/index.tsx',
        }),
      ],
    });
    expect(rejected.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'path_extension_not_allowed',
        kind: 'js-page',
        path: 'src/client/js-pages/orders/style.css',
      }),
    );
  });

  it('selects the entry index path by fixed priority instead of file order', () => {
    const validator = new LightExtensionValidator();
    const first = validator.validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.js',
          content: 'export default function SalesKpiJs() { return null; }\n',
        },
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'export default function SalesKpiTsx() { return null; }\n',
        },
        entryDescriptor(),
      ],
    });
    const second = validator.validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'export default function SalesKpiTsx() { return null; }\n',
        },
        {
          path: 'src/client/js-blocks/sales-kpi/index.js',
          content: 'export default function SalesKpiJs() { return null; }\n',
        },
        entryDescriptor(),
      ],
    });

    expect(first.entries[0].entryPath).toBe('src/client/js-blocks/sales-kpi/index.tsx');
    expect(second.entries[0].entryPath).toBe('src/client/js-blocks/sales-kpi/index.tsx');
  });

  it('rejects traversal, absolute paths, invalid entry names, and unsupported entry files', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: '../escape.ts',
          content: '',
        },
        {
          path: '/src/client/js-blocks/sales-kpi/index.tsx',
          content: '',
        },
        {
          path: 'src/client/js-blocks/Sales KPI/index.tsx',
          content: '',
        },
        {
          path: 'src/client/js-blocks/sales-kpi/style.css',
          content: '.root {}',
        },
        {
          path: 'src/client/js-blocks/foo/../bar/index.tsx',
          content: '',
        },
        {
          path: 'src/client/js-blocks/foo/./index.tsx',
          content: '',
        },
        {
          path: 'src/client/js-blocks/foo//index.tsx',
          content: '',
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        'path_traversal_not_allowed',
        'path_absolute_not_allowed',
        'invalid_entry_name',
        'path_extension_not_allowed',
        'path_segment_invalid',
      ]),
    );
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'path_traversal_not_allowed',
        path: 'src/client/js-blocks/foo/../bar/index.tsx',
      }),
    );
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'path_segment_invalid',
        path: 'src/client/js-blocks/foo/./index.tsx',
      }),
    );
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'path_segment_invalid',
        path: 'src/client/js-blocks/foo//index.tsx',
      }),
    );
  });

  it('rejects unsupported shared file extensions and shared imports outside src/shared', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/shared/style.css',
          content: '.root {}',
        },
        {
          path: 'src/shared',
          content: 'not a file path\n',
        },
        {
          path: 'src/shared/leak.ts',
          content: 'import "../server/private";\nexport const leak = true;\n',
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'path_extension_not_allowed',
          path: 'src/shared/style.css',
        }),
        expect.objectContaining({
          code: 'workspace_path_not_allowed',
          path: 'src/shared',
        }),
        expect.objectContaining({
          code: 'import_not_allowed',
          path: 'src/shared/leak.ts',
        }),
      ]),
    );
  });
});

function entryDescriptor() {
  return {
    path: 'src/client/js-blocks/sales-kpi/entry.json',
    content: '{"schemaVersion":1,"key":"sales-kpi"}',
  };
}

describe('limits', () => {
  it.each([
    {
      name: 'single file size',
      limits: { maxFileBytes: 4 },
      content: '12345',
      code: 'file_size_limit_exceeded',
      path: 'src/client/js-blocks/sales-kpi/index.tsx',
      details: { size: 5, maxFileBytes: 4 },
    },
    {
      name: 'single file UTF-8 byte size',
      limits: { maxFileBytes: 2 },
      content: '你',
      code: 'file_size_limit_exceeded',
      path: 'src/client/js-blocks/sales-kpi/index.tsx',
      details: { size: 3, maxFileBytes: 2 },
    },
    {
      name: 'repository byte budget',
      limits: { maxRepoBytes: 4 },
      content: '12345',
      code: 'repo_budget_limit_exceeded',
      path: undefined,
      details: { totalBytes: 5, maxRepoBytes: 4 },
    },
    {
      name: 'repository UTF-8 byte budget',
      limits: { maxRepoBytes: 2 },
      content: '你',
      code: 'repo_budget_limit_exceeded',
      path: undefined,
      details: { totalBytes: 3, maxRepoBytes: 2 },
    },
  ])('enforces $name from actual content bytes', ({ limits, content, code, path, details }) => {
    const result = new LightExtensionValidator({ limits }).validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content,
          size: 1,
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code,
        ...(path ? { path } : {}),
        details: expect.objectContaining(details),
      }),
    );
  });

  it.each([
    { name: 'batch file count', limits: { maxSyncBatchFiles: 1 }, code: 'sync_batch_too_large' },
    { name: 'file byte size', limits: { maxFileBytes: 1 }, code: 'file_size_limit_exceeded' },
  ])('enforces sync $name limits', ({ limits, code }) => {
    const validator = new LightExtensionValidator({ limits });
    const diagnostics = validator.validateSyncBatch({
      files: [
        { path: 'src/client/js-blocks/sales-kpi/index.tsx', content: '你', size: 1 },
        { path: 'src/client/js-blocks/sales-kpi/meta.json', content: '{}' },
      ],
    });

    expect(diagnostics).toContainEqual(expect.objectContaining({ code }));
  });

  it('requires content for upserts while allowing delete-only items', () => {
    const diagnostics = new LightExtensionValidator().validateSyncBatch({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          blobHash: 'caller-supplied-blob',
          size: 1,
        },
        {
          path: 'src/client/js-blocks/sales-kpi/old.tsx',
          operation: 'delete',
        },
      ],
    });

    expect(diagnostics.filter((item) => item.code === 'source_content_required')).toEqual([
      expect.objectContaining({ path: 'src/client/js-blocks/sales-kpi/index.tsx' }),
    ]);
  });

  it('enforces entry count, entry file count, and zip ratio limits from capabilities', () => {
    const validator = new LightExtensionValidator({
      limits: {
        maxEntries: 1,
        maxEntryFiles: 1,
        maxZipCompressionRatio: 2,
      },
    });
    const workspace = validator.validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/one/index.tsx',
          content: 'export default function One() { return null; }\n',
        },
        {
          path: 'src/client/js-blocks/one/meta.json',
          content: '{}',
        },
        {
          path: 'src/client/js-blocks/two/index.tsx',
          content: 'export default function Two() { return null; }\n',
        },
      ],
    });
    const zip = validator.validateZipBudget({
      compressedBytes: 10,
      uncompressedBytes: 100,
    });

    expect(workspace.accepted).toBe(false);
    expect(workspace.capabilities.limits.maxEntries).toBe(1);
    expect(workspace.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining(['entry_count_limit_exceeded', 'entry_file_count_exceeded']),
    );
    expect(zip).toContainEqual(expect.objectContaining({ code: 'zip_compression_ratio_too_high' }));
  });
});

describe('module import', () => {
  it('rejects forbidden module forms with located diagnostics', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: [
            "import unsupported from 'unsupported-package';",
            "import fs = require('fs');",
            "export * from 'react';",
            "const fs = require('fs');",
            "import('./lazy');",
          ].join('\n'),
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining(['import_not_allowed', 'require_not_allowed', 'dynamic_import_not_allowed']),
    );
    expect(result.diagnostics.filter((item) => item.code === 'import_not_allowed')).toHaveLength(3);
    expect(result.diagnostics.filter((item) => item.code === 'require_not_allowed')).toHaveLength(2);
    expect(result.diagnostics.filter((item) => item.code === 'dynamic_import_not_allowed')).toHaveLength(1);
    expect(result.diagnostics.filter((item) => item.code === 'blocked_global_api')).toHaveLength(0);
    expect(
      result.diagnostics
        .filter((item) =>
          ['import_not_allowed', 'require_not_allowed', 'dynamic_import_not_allowed'].includes(item.code),
        )
        .every((item) => item.path === 'src/client/js-blocks/sales-kpi/index.tsx' && item.line && item.column),
    ).toBe(true);
  });

  it('allows built-in module imports that compile to ctx.libs', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/react-hooks/index.tsx',
          content: [
            `import type { FC } from 'react';`,
            `import { type ReactNode } from 'react';`,
            `import React, { useEffect } from 'react';`,
            `import * as ReactDOM from 'react-dom/client';`,
            `const Component: FC<{ children?: ReactNode }> = ({ children }) => <div>{children}</div>;`,
            `ctx.render(<Component>{String(React && ReactDOM && useEffect)}</Component>);`,
          ].join('\n'),
        },
        {
          path: 'src/client/js-blocks/react-hooks/entry.json',
          content: JSON.stringify({ schemaVersion: 1, key: 'react-hooks' }),
        },
      ],
    });

    expect(result.accepted).toBe(true);
    expect(result.diagnostics.filter((item) => item.code === 'import_not_allowed')).toEqual([]);
  });

  it.each([`import 'react';`, `import {} from 'react';`])(
    'rejects built-in runtime imports without bindings: %s',
    (importStatement) => {
      const result = new LightExtensionValidator().validateWorkspace({
        files: [
          {
            path: 'src/client/js-blocks/react-side-effect/index.tsx',
            content: `${importStatement}\nctx.render(<div />);`,
          },
          {
            path: 'src/client/js-blocks/react-side-effect/entry.json',
            content: JSON.stringify({ schemaVersion: 1, key: 'react-side-effect' }),
          },
        ],
      });

      expect(result.accepted).toBe(false);
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({
          code: 'import_not_allowed',
          message: 'Runtime import from "react" must bind a default, namespace, or named export',
          path: 'src/client/js-blocks/react-side-effect/index.tsx',
        }),
      );
    },
  );

  it.each(['react/jsx-runtime', 'react-dom', 'dayjs/plugin/utc', 'lodash/get', '__proto__', 'constructor', 'toString'])(
    'rejects unsupported module specifier %s',
    (specifier) => {
      const result = new LightExtensionValidator().validateWorkspace({
        files: [
          {
            path: 'src/client/js-blocks/unsupported-subpath/index.tsx',
            content: `import value from '${specifier}';\nctx.render(<div>{String(value)}</div>);`,
          },
          {
            path: 'src/client/js-blocks/unsupported-subpath/entry.json',
            content: JSON.stringify({ schemaVersion: 1, key: 'unsupported-subpath' }),
          },
        ],
      });

      expect(result.accepted).toBe(false);
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({
          code: 'import_not_allowed',
          message: `Import "${specifier}" is not allowed in light-extension source`,
          path: 'src/client/js-blocks/unsupported-subpath/index.tsx',
        }),
      );
    },
  );

  it('still rejects require references and aliases', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: [
            'const req = require;',
            'req("fs");',
            'globalThis.require("fs");',
            'Reflect.get(globalThis, "require")("fs");',
            'const { require: reqFromGlobal } = globalThis;',
            'reqFromGlobal("fs");',
            'const requireList = [require];',
            'requireList[0]("fs");',
          ].join('\n'),
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics.filter((item) => item.code === 'require_not_allowed').length).toBeGreaterThanOrEqual(6);
    expect(result.diagnostics.filter((item) => item.code === 'blocked_global_api')).toHaveLength(0);
  });

  it('allows bare global APIs that are allowed by RunJS on next', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/global-api/index.tsx',
          content: [
            'const nodeEnv = process.env.NODE_ENV;',
            'const evalValue = eval("1");',
            'const factoryValue = Function("return 2")();',
            'const reflectedEval = Reflect.get(globalThis, "eval")("3");',
            'const descriptorFactory = Object.getOwnPropertyDescriptor(globalThis, "Function")?.value("return 4")();',
            'ctx.render(<div>{String(nodeEnv || evalValue || factoryValue || reflectedEval || descriptorFactory)}</div>);',
          ].join('\n'),
        },
        {
          path: 'src/client/js-blocks/global-api/entry.json',
          content: JSON.stringify({ schemaVersion: 1, key: 'global-api' }),
        },
      ],
    });

    expect(result.accepted).toBe(true);
    expect(result.diagnostics.filter((item) => item.code === 'blocked_global_api')).toHaveLength(0);
  });

  it('rejects relative imports that leave the current entry root', () => {
    const cases = [
      {
        name: 'js-block imports another entry source',
        content: 'import helper from "../other-block/helper";\nexport default helper;\n',
      },
      {
        name: 'js-block imports another entry source with parent traversal',
        content: 'import helper from "./../other-block/helper";\nexport default helper;\n',
      },
      {
        name: 'js-block re-exports another entry source',
        content: 'export * from "../other-block/helper";\nexport default function SalesKpi() { return null; }\n',
      },
      {
        name: 'js-block imports disabled js-field source',
        content: 'import field from "../../js-fields/foo/index";\nexport default field;\n',
      },
    ];

    for (const [index, item] of cases.entries()) {
      const result = new LightExtensionValidator().validateWorkspace({
        files: [
          {
            path: `src/client/js-blocks/import-boundary-${index}/index.tsx`,
            content: item.content,
          },
        ],
      });

      expect(result.accepted, item.name).toBe(false);
      expect(
        result.diagnostics.some((diagnostic) => diagnostic.code === 'import_not_allowed'),
        item.name,
      ).toBe(true);
    }
  });

  it('allows relative imports within the same entry root', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/local-import/index.tsx',
          content: [
            'import { helper } from "./helper";',
            'export { helper as localHelper } from "./helper";',
            'export default function LocalImport() { return helper(); }',
          ].join('\n'),
        },
        {
          path: 'src/client/js-blocks/local-import/helper.ts',
          content: 'export function helper() { return null; }\n',
        },
        {
          path: 'src/client/js-blocks/local-import/entry.json',
          content: JSON.stringify({ schemaVersion: 1, key: 'local-import' }),
        },
      ],
    });

    expect(result.accepted).toBe(true);
    expect(result.diagnostics.filter((item) => item.code === 'import_not_allowed')).toHaveLength(0);
  });

  it('allows JS Page entry and shared imports but rejects another JS Page root', () => {
    const validator = new LightExtensionValidator();
    const accepted = validator.validateWorkspace({
      files: [
        {
          path: 'src/shared/format.ts',
          content: 'export const format = (value: string) => value.toUpperCase();\n',
        },
        {
          path: 'src/client/js-pages/orders/index.tsx',
          content:
            'import { title } from "./title";\nimport { format } from "../../../shared/format";\nctx.render(<div>{format(title)}</div>);\n',
        },
        {
          path: 'src/client/js-pages/orders/title.ts',
          content: 'export const title = "Orders";\n',
        },
        {
          path: 'src/client/js-pages/orders/entry.json',
          content: JSON.stringify({ schemaVersion: 1, key: 'orders' }),
        },
      ],
    });
    const rejected = validator.validateWorkspace({
      files: [
        {
          path: 'src/client/js-pages/orders/index.tsx',
          content: 'import { title } from "../other/title";\nctx.render(<div>{title}</div>);\n',
        },
        {
          path: 'src/client/js-pages/orders/entry.json',
          content: JSON.stringify({ schemaVersion: 1, key: 'orders' }),
        },
      ],
    });

    expect(accepted.accepted).toBe(true);
    expect(accepted.diagnostics).toEqual([]);
    expect(rejected.accepted).toBe(false);
    expect(rejected.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'import_not_allowed',
        kind: 'js-page',
        path: 'src/client/js-pages/orders/index.tsx',
      }),
    );
  });
});

describe('runtime global/security', () => {
  let bridge: LightExtensionWorkspaceCompilerBridge;

  beforeEach(() => {
    bridge = new LightExtensionWorkspaceCompilerBridge();
  });

  it.each([
    {
      name: 'dynamic import',
      source: "const mod = await import('./secret');\nctx.render(<div>{mod}</div>);\n",
      expectedCode: 'RUNJS_DYNAMIC_IMPORT_UNSUPPORTED',
    },
    {
      name: 'require fs',
      source: "const fs = require('fs');\nctx.render(<div>{String(fs)}</div>);\n",
      expectedCode: 'RUNJS_IMPORT_NOT_ALLOWED',
    },
    {
      name: 'unsupported package import',
      source: "import moduleValue from 'unsupported-package';\nctx.render(<div>{String(moduleValue)}</div>);\n",
      expectedCode: 'RUNJS_IMPORT_NOT_ALLOWED',
    },
    {
      name: 'unknown process global',
      source: 'const value = process.env.NODE_ENV;\nctx.render(<div>{value}</div>);\n',
      expectedRuleId: 'runjs-global-unknown',
    },
  ])('rejects $name', async (caseItem) => {
    const result = await bridge.compileEntry({
      repoId: 'ler_security',
      kind: 'js-block',
      entryName: 'security-negative',
      entryPath: 'src/client/js-blocks/security-negative/index.tsx',
      files: [
        {
          path: 'src/client/js-blocks/security-negative/index.tsx',
          content: caseItem.source,
        },
      ],
    });

    expect(result.accepted).toBe(false);
    if (caseItem.expectedCode) {
      expect(result.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: caseItem.expectedCode,
          }),
        ]),
      );
    }
    if (caseItem.expectedRuleId) {
      expect(result.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            details: expect.objectContaining({
              ruleId: caseItem.expectedRuleId,
            }),
          }),
        ]),
      );
    }
  });

  it.each([
    {
      name: 'Function constructor',
      source: 'const value = Function("return 1")();\nctx.render(<div>{value}</div>);\n',
    },
    {
      name: 'eval call',
      source: 'const value = eval("1");\nctx.render(<div>{value}</div>);\n',
    },
  ])('allows $name as a normal RunJS global', async (caseItem) => {
    const result = await bridge.compileEntry({
      repoId: 'ler_security',
      kind: 'js-block',
      entryName: 'security-allowed',
      entryPath: 'src/client/js-blocks/security-allowed/index.tsx',
      files: [
        {
          path: 'src/client/js-blocks/security-allowed/index.tsx',
          content: caseItem.source,
        },
      ],
    });

    expect(result.accepted).toBe(true);
    expect(result.diagnostics.some((diagnostic) => diagnostic.severity === 'error')).toBe(false);
  });
});
