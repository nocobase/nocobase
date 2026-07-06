/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LightExtensionValidator } from '../services/LightExtensionValidator';

describe('plugin-light-extension path validator', () => {
  it('accepts js-block entry files under the allowlisted source root', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'export default function SalesKpi() { return null; }\n',
        },
        {
          path: 'src/client/js-blocks/sales-kpi/settings.json',
          content: '{"type":"object","properties":{}}',
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
});
