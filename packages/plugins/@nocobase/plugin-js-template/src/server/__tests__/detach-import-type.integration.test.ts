/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { compileRunJSSourceWorkspace } from '@nocobase/runjs/compiler';
import { describe, expect, it } from 'vitest';

import { collectAndRelocateInlineFiles } from '../services/DetachJsTemplateToInlineService';

describe('detach ImportType integration', () => {
  it('copies and rewrites the reachable type closure into a compilable inline workspace', async () => {
    const relocated = collectAndRelocateInlineFiles({
      entryPath: 'src/client/js-blocks/sales/index.tsx',
      files: [
        {
          path: 'src/client/js-blocks/sales/index.tsx',
          content: [
            `type Row = import('../../../shared/models/row').Row;`,
            `const row: Row = { label: 'Static type' };`,
            `ctx.render(<div>{row.label}</div>);`,
          ].join('\n'),
        },
        {
          path: 'src/shared/models/row.ts',
          content: `export interface Row { label: string }`,
        },
        {
          path: 'src/shared/models/unused.ts',
          content: `export interface Unused { value: string }`,
        },
        {
          path: 'src/client/js-blocks/sibling/types.ts',
          content: `export interface Sibling { value: string }`,
        },
      ],
    });

    expect(relocated.map((file) => file.path)).toEqual(['src/client/index.tsx', 'src/shared/models/row.ts']);
    const entry = relocated.find((file) => file.path === 'src/client/index.tsx');
    expect(entry?.content).toContain(`import('../shared/models/row').Row`);
    expect(entry?.content).not.toContain(`../../../shared/models/row`);
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/client/index.tsx',
      files: relocated,
      surfaceStyle: 'render',
    });

    expect(result.failureCode, JSON.stringify(result.artifact.diagnostics, null, 2)).toBeUndefined();
    expect(result.artifact.diagnostics.filter((diagnostic) => diagnostic.severity === 'error')).toEqual([]);
  });

  it('does not copy an existing sibling Template reached only through ImportType', () => {
    expect(() =>
      collectAndRelocateInlineFiles({
        entryPath: 'src/client/js-blocks/sales/index.ts',
        files: [
          {
            path: 'src/client/js-blocks/sales/index.ts',
            content: `type Sibling = import('../sibling/types').Sibling;\nreturn null as unknown as Sibling;`,
          },
          {
            path: 'src/client/js-blocks/sibling/types.ts',
            content: `export interface Sibling { value: string }`,
          },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: 'JS_TEMPLATE_INVALID_INPUT' }));
  });
});
