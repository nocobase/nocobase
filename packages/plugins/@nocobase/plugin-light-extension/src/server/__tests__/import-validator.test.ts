/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LightExtensionValidator } from '../services/LightExtensionValidator';

describe('plugin-light-extension import validator', () => {
  it('rejects forbidden module forms with located diagnostics', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: [
            "import React from 'react';",
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
      ],
    });

    expect(result.accepted).toBe(true);
    expect(result.diagnostics.filter((item) => item.code === 'import_not_allowed')).toHaveLength(0);
  });
});
