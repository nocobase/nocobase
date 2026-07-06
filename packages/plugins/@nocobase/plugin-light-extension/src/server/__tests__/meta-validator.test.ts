/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LightExtensionValidator } from '../services/LightExtensionValidator';

describe('plugin-light-extension meta validator', () => {
  it('accepts supported meta fields and maps them onto the entry snapshot', () => {
    const validator = new LightExtensionValidator();
    const result = validator.validateWorkspace({
      files: entryFiles({
        'meta.json': JSON.stringify({
          title: 'Sales KPI',
          description: 'Shows sales KPIs',
          category: 'sales',
          icon: 'BarChart',
          tags: ['sales', 'kpi'],
          sort: 10,
        }),
      }),
    });

    expect(result.accepted).toBe(true);
    expect(result.entries[0]).toMatchObject({
      title: 'Sales KPI',
      description: 'Shows sales KPIs',
      category: 'sales',
      icon: 'BarChart',
      tags: ['sales', 'kpi'],
      sort: 10,
    });
  });

  it('rejects invalid meta JSON and unsupported field shapes with file diagnostics', () => {
    const validator = new LightExtensionValidator();
    const invalidJson = validator.validateWorkspace({
      files: entryFiles({
        'meta.json': '{',
      }),
    });
    const invalidFields = validator.validateWorkspace({
      files: entryFiles({
        'meta.json': JSON.stringify({
          title: 123,
          category: 'Sales KPI',
          tags: ['ok', 1],
          sort: 'first',
          unknown: true,
        }),
      }),
    });

    expect(invalidJson.accepted).toBe(false);
    expect(invalidJson.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'meta_json_invalid',
        path: 'src/client/js-blocks/sales-kpi/meta.json',
      }),
    );
    expect(invalidJson.diagnostics.filter((item) => item.code === 'meta_json_invalid')).toHaveLength(1);
    expect(invalidFields.accepted).toBe(false);
    expect(invalidFields.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining(['meta_field_invalid', 'meta_unknown_field']),
    );
    expect(new Set(invalidFields.diagnostics.map((item) => item.path))).toContain(
      'src/client/js-blocks/sales-kpi/meta.json',
    );
  });
});

function entryFiles(overrides: Record<string, string> = {}) {
  const root = 'src/client/js-blocks/sales-kpi';
  return [
    {
      path: `${root}/index.tsx`,
      content: 'export default function SalesKpi() { return null; }\n',
    },
    {
      path: `${root}/meta.json`,
      content: overrides['meta.json'] || '{}',
    },
  ];
}
