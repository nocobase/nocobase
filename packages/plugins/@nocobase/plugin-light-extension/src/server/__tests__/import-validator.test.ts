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
  it('rejects forbidden module forms with located problems', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      snapshotId: 'snapshot-test',
      requestId: 'request-test',
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
    expect(result.problems.map((item) => item.code)).toEqual(
      expect.arrayContaining(['import_not_allowed', 'require_not_allowed', 'dynamic_import_not_allowed']),
    );
    expect(result.problems.filter((item) => item.code === 'import_not_allowed')).toHaveLength(3);
    expect(result.problems.filter((item) => item.code === 'require_not_allowed')).toHaveLength(2);
    expect(result.problems.filter((item) => item.code === 'dynamic_import_not_allowed')).toHaveLength(1);
    expect(result.problems.filter((item) => item.code === 'blocked_global_api')).toHaveLength(0);
    expect(result.problems.find((item) => item.code === 'import_not_allowed')).toEqual(
      expect.objectContaining({
        schemaVersion: 1,
        phase: 'policy',
        source: 'validator',
        snapshotId: 'snapshot-test',
        requestId: 'request-test',
        fingerprint: expect.stringMatching(/^problem-v1:/u),
      }),
    );
    expect(
      result.problems
        .filter((item) =>
          ['import_not_allowed', 'require_not_allowed', 'dynamic_import_not_allowed'].includes(item.code),
        )
        .every(
          (item) =>
            item.path === 'src/client/js-blocks/sales-kpi/index.tsx' &&
            item.range?.start.line &&
            item.range.start.column,
        ),
    ).toBe(true);
  });

  it('allows built-in module imports that compile to ctx.libs', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      snapshotId: 'snapshot-test',
      requestId: 'request-test',
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
    expect(result.problems.filter((item) => item.code === 'import_not_allowed')).toEqual([]);
  });

  it.each([`import 'react';`, `import {} from 'react';`])(
    'rejects built-in runtime imports without bindings: %s',
    (importStatement) => {
      const result = new LightExtensionValidator().validateWorkspace({
        snapshotId: 'snapshot-test',
        requestId: 'request-test',
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
      expect(result.problems).toContainEqual(
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
        snapshotId: 'snapshot-test',
        requestId: 'request-test',
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
      expect(result.problems).toContainEqual(
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
      snapshotId: 'snapshot-test',
      requestId: 'request-test',
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
    expect(result.problems.filter((item) => item.code === 'require_not_allowed').length).toBeGreaterThanOrEqual(6);
    expect(result.problems.filter((item) => item.code === 'blocked_global_api')).toHaveLength(0);
  });

  it('allows bare global APIs that are allowed by RunJS on next', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      snapshotId: 'snapshot-test',
      requestId: 'request-test',
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
    expect(result.problems.filter((item) => item.code === 'blocked_global_api')).toHaveLength(0);
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
        snapshotId: 'snapshot-test',
        requestId: 'request-test',
        files: [
          {
            path: `src/client/js-blocks/import-boundary-${index}/index.tsx`,
            content: item.content,
          },
        ],
      });

      expect(result.accepted, item.name).toBe(false);
      expect(
        result.problems.some((problem) => problem.code === 'import_not_allowed'),
        item.name,
      ).toBe(true);
    }
  });

  it('allows relative imports within the same entry root', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      snapshotId: 'snapshot-test',
      requestId: 'request-test',
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
    expect(result.problems.filter((item) => item.code === 'import_not_allowed')).toHaveLength(0);
  });

  it('allows JS Page entry and shared imports but rejects another JS Page root', () => {
    const validator = new LightExtensionValidator();
    const accepted = validator.validateWorkspace({
      snapshotId: 'snapshot-test',
      requestId: 'request-test',
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
      snapshotId: 'snapshot-test',
      requestId: 'request-test',
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
    expect(accepted.problems).toEqual([]);
    expect(rejected.accepted).toBe(false);
    expect(rejected.problems).toContainEqual(
      expect.objectContaining({
        code: 'import_not_allowed',
        kind: 'js-page',
        path: 'src/client/js-pages/orders/index.tsx',
      }),
    );
  });
});
