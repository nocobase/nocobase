/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JsTemplateValidator } from '../services/JsTemplateValidator';
import { JsTemplateWorkspaceCompilerBridge } from '../services/JsTemplateWorkspaceCompilerBridge';

describe('path', () => {
  it('accepts js-block entry files under the allowlisted source root', () => {
    const result = new JsTemplateValidator().validateWorkspace({
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
    expect(result.templates[0]).toMatchObject({
      kind: 'js-block',
      templateName: 'sales-kpi',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
    });
  });

  it('accepts project root files and shared helper files', () => {
    const result = new JsTemplateValidator().validateWorkspace({
      files: [
        {
          path: 'README.md',
          content: '# demo\n',
        },
        {
          path: 'js-template.json',
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

  it('allows canonical SDK types and helpers through a shared helper in a JS Field template', () => {
    const sdkPackageName = '@nocobase/js-template-sdk';
    const result = new JsTemplateValidator().validateWorkspace({
      files: [
        {
          path: 'src/shared/format.ts',
          content: `import type { JsTemplateSettingsContext } from "${sdkPackageName}/shared";\nexport function formatValue(ctx: JsTemplateSettingsContext) { return String(ctx.settings ?? ""); }\n`,
        },
        {
          path: 'src/client/js-fields/phone-link/index.tsx',
          content: `import { type JsTemplateSettingsContext, defineSettings } from "${sdkPackageName}/client";\nimport { formatValue } from "../../../shared/format";\nexport const settings = defineSettings({ type: "object", properties: {} });\nexport default function PhoneLink(ctx: JsTemplateSettingsContext) { return formatValue(ctx); }\n`,
        },
        {
          path: 'src/client/js-fields/phone-link/entry.json',
          content: '{"schemaVersion":1,"key":"phone-link"}',
        },
      ],
    });

    expect(result.accepted).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });

  it('accepts JS Page entry modules without allowing page-specific assets', () => {
    const validator = new JsTemplateValidator();
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
      templates: [
        expect.objectContaining({
          kind: 'js-page',
          templateName: 'orders',
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
    const validator = new JsTemplateValidator();
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

    expect(first.templates[0].entryPath).toBe('src/client/js-blocks/sales-kpi/index.tsx');
    expect(second.templates[0].entryPath).toBe('src/client/js-blocks/sales-kpi/index.tsx');
  });

  it('rejects traversal, absolute paths, invalid template names, and unsupported template files', () => {
    const result = new JsTemplateValidator().validateWorkspace({
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
        'invalid_template_name',
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
    const result = new JsTemplateValidator().validateWorkspace({
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
      name: 'project byte budget',
      limits: { maxProjectBytes: 4 },
      content: '12345',
      code: 'project_budget_limit_exceeded',
      path: undefined,
      details: { totalBytes: 5, maxProjectBytes: 4 },
    },
    {
      name: 'project UTF-8 byte budget',
      limits: { maxProjectBytes: 2 },
      content: '你',
      code: 'project_budget_limit_exceeded',
      path: undefined,
      details: { totalBytes: 3, maxProjectBytes: 2 },
    },
  ])('enforces $name from actual content bytes', ({ limits, content, code, path, details }) => {
    const result = new JsTemplateValidator({ limits }).validateWorkspace({
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
    const validator = new JsTemplateValidator({ limits });
    const diagnostics = validator.validateSyncBatch({
      files: [
        { path: 'src/client/js-blocks/sales-kpi/index.tsx', content: '你', size: 1 },
        { path: 'src/client/js-blocks/sales-kpi/meta.json', content: '{}' },
      ],
    });

    expect(diagnostics).toContainEqual(expect.objectContaining({ code }));
  });

  it('requires content for upserts while allowing delete-only items', () => {
    const diagnostics = new JsTemplateValidator().validateSyncBatch({
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
    const validator = new JsTemplateValidator({
      limits: {
        maxTemplates: 1,
        maxTemplateFiles: 1,
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
    expect(workspace.capabilities.limits.maxTemplates).toBe(1);
    expect(workspace.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining(['template_count_limit_exceeded', 'template_file_count_exceeded']),
    );
    expect(zip).toContainEqual(expect.objectContaining({ code: 'zip_compression_ratio_too_high' }));
  });
});

describe('module import', () => {
  it('rejects forbidden module forms with located diagnostics', () => {
    const result = new JsTemplateValidator().validateWorkspace({
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

  it.each([`import 'react';`, `import {} from 'react';`])(
    'rejects built-in runtime imports without bindings: %s',
    (importStatement) => {
      const result = new JsTemplateValidator().validateWorkspace({
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

  it('rejects empty runtime imports from SDK subpaths', () => {
    const result = new JsTemplateValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-fields/phone-link/index.tsx',
          content:
            'import {} from "@nocobase/js-template-sdk/client";\nexport default function PhoneLink() { return null; }\n',
        },
        {
          path: 'src/client/js-fields/phone-link/entry.json',
          content: '{"schemaVersion":1,"key":"phone-link"}',
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'import_not_allowed',
        kind: 'js-field',
        path: 'src/client/js-fields/phone-link/index.tsx',
      }),
    );
  });

  it.each(['react/jsx-runtime', 'react-dom', 'dayjs/plugin/utc', 'lodash/get', '__proto__', 'constructor', 'toString'])(
    'rejects unsupported module specifier %s',
    (specifier) => {
      const result = new JsTemplateValidator().validateWorkspace({
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
          message: `Import "${specifier}" is not allowed in js-template source`,
          path: 'src/client/js-blocks/unsupported-subpath/index.tsx',
        }),
      );
    },
  );

  it('still rejects require references and aliases', () => {
    const result = new JsTemplateValidator().validateWorkspace({
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
      const result = new JsTemplateValidator().validateWorkspace({
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

  it('allows JS Page entry and shared imports but rejects another JS Page root', () => {
    const validator = new JsTemplateValidator();
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

  it('applies Template, shared, and descriptor boundaries to relative ImportType references', () => {
    const validator = new JsTemplateValidator();
    const accepted = validator.validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales/index.ts',
          content: [
            `type Local = import('./types').Local;`,
            `type Shared = import('../../../shared/types').Shared;`,
            `export type Combined = Local & Shared;`,
          ].join('\n'),
        },
        { path: 'src/client/js-blocks/sales/types.ts', content: `export interface Local { local: true }` },
        { path: 'src/shared/types.ts', content: `export interface Shared { shared: true }` },
        {
          path: 'src/client/js-blocks/sales/entry.json',
          content: JSON.stringify({ schemaVersion: 1, key: 'sales' }),
        },
      ],
    });
    const rejected = validator.validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales/index.ts',
          content: [
            `type Sibling = import('../sibling/types').Sibling;`,
            `type Descriptor = import('./entry.json').default;`,
          ].join('\n'),
        },
        {
          path: 'src/client/js-blocks/sales/entry.json',
          content: JSON.stringify({ schemaVersion: 1, key: 'sales' }),
        },
      ],
    });
    const rejectedShared = validator.validateWorkspace({
      files: [
        {
          path: 'src/shared/types.ts',
          content: `export type Template = import('../client/js-blocks/sales/types').Local;`,
        },
      ],
    });

    expect(accepted.accepted).toBe(true);
    expect(accepted.diagnostics).toEqual([]);
    expect(rejected.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'import_not_allowed',
          path: 'src/client/js-blocks/sales/index.ts',
          line: 1,
        }),
        expect.objectContaining({
          code: 'entry_descriptor_import_not_allowed',
          path: 'src/client/js-blocks/sales/index.ts',
          line: 2,
        }),
      ]),
    );
    expect(rejectedShared.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'import_not_allowed',
        path: 'src/shared/types.ts',
      }),
    );
  });
});

describe('runtime global/security', () => {
  let bridge: JsTemplateWorkspaceCompilerBridge;

  beforeEach(() => {
    bridge = new JsTemplateWorkspaceCompilerBridge();
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
      projectId: 'jtp_security',
      kind: 'js-block',
      templateName: 'security-negative',
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
      projectId: 'jtp_security',
      kind: 'js-block',
      templateName: 'security-allowed',
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
