/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LightExtensionValidator } from '../services/LightExtensionValidator';

describe('plugin-light-extension kind enablement validator', () => {
  it('keeps future client kinds supported but not enabled in the MVP and reports warnings instead of crashing', () => {
    const validator = new LightExtensionValidator();
    const result = validator.validateWorkspace({
      files: [
        {
          path: 'src/client/js-fields/phone-link/index.tsx',
          content: 'export default function PhoneLink() { return null; }\n',
        },
        {
          path: 'src/client/js-actions/batch-approve/index.ts',
          content: 'export default async function batchApprove() { return true; }\n',
        },
        {
          path: 'src/client/js-items/customer-menu/index.tsx',
          content: 'export default function CustomerMenuItem() { return null; }\n',
        },
        {
          path: 'src/client/runjs/sales-kpi/index.tsx',
          content: 'export default async function run() { return 1; }\n',
        },
        {
          path: 'src/client/runjs/sales-kpi/README.md',
          content: '# runjs\n',
        },
        {
          path: 'src/client/events/log-page-open/index.ts',
          content: 'export default function onPageOpen() { return true; }\n',
        },
      ],
    });

    expect(result.accepted).toBe(true);
    expect(result.capabilities.supportedKinds).toEqual(
      expect.arrayContaining(['js-block', 'js-field', 'js-action', 'js-item', 'runjs', 'event']),
    );
    expect(result.capabilities.enabledKinds).toEqual(['js-block']);
    expect(result.entries.map((entry) => `${entry.kind}:${entry.entryName}`)).toEqual([
      'event:log-page-open',
      'js-action:batch-approve',
      'js-field:phone-link',
      'js-item:customer-menu',
      'runjs:sales-kpi',
    ]);
    expect(result.diagnostics.filter((item) => item.code === 'kind_not_enabled')).toEqual([
      expect.objectContaining({
        severity: 'warning',
        kind: 'event',
        path: 'src/client/events/log-page-open',
      }),
      expect.objectContaining({
        severity: 'warning',
        kind: 'js-action',
        path: 'src/client/js-actions/batch-approve',
      }),
      expect.objectContaining({
        severity: 'warning',
        kind: 'js-field',
        path: 'src/client/js-fields/phone-link',
      }),
      expect.objectContaining({
        severity: 'warning',
        kind: 'js-item',
        path: 'src/client/js-items/customer-menu',
      }),
      expect.objectContaining({
        severity: 'warning',
        kind: 'runjs',
        path: 'src/client/runjs/sales-kpi',
      }),
    ]);
    expect(result.capabilities.allowedPaths.entries.runjs).toEqual(
      expect.arrayContaining([
        'src/client/runjs/<entryName>/index.tsx',
        'src/client/runjs/<entryName>/**/*.{ts,tsx,js,jsx,json,md}',
      ]),
    );
    expect(result.capabilities.allowedPaths.entries['js-field']).toEqual(
      expect.arrayContaining([
        'src/client/js-fields/<entryName>/index.tsx',
        'src/client/js-fields/<entryName>/**/*.{ts,tsx,js,jsx,json,md}',
      ]),
    );
  });
});
