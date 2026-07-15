/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LightExtensionValidator } from '../services/LightExtensionValidator';

describe('plugin-light-extension supported kinds validator', () => {
  it('accepts every supported client kind', () => {
    const validator = new LightExtensionValidator();
    const result = validator.validateWorkspace({
      files: [
        {
          path: 'src/client/js-fields/phone-link/index.tsx',
          content: 'export default function PhoneLink() { return null; }\n',
        },
        entryDescriptor('src/client/js-fields/phone-link', 'phone-link'),
        {
          path: 'src/client/js-actions/batch-approve/index.ts',
          content: 'export default async function batchApprove() { return true; }\n',
        },
        entryDescriptor('src/client/js-actions/batch-approve', 'batch-approve'),
        {
          path: 'src/client/js-items/customer-menu/index.tsx',
          content: 'export default function CustomerMenuItem() { return null; }\n',
        },
        entryDescriptor('src/client/js-items/customer-menu', 'customer-menu'),
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'ctx.render(<div />);\n',
        },
        entryDescriptor('src/client/js-blocks/sales-kpi', 'sales-kpi'),
      ],
    });

    expect(result.accepted).toBe(true);
    expect(result.capabilities.supportedKinds).toEqual(['js-block', 'js-field', 'js-action', 'js-item']);
    expect(result.entries.map((entry) => `${entry.kind}:${entry.entryName}`)).toEqual([
      'js-action:batch-approve',
      'js-block:sales-kpi',
      'js-field:phone-link',
      'js-item:customer-menu',
    ]);
    expect(result.diagnostics).toEqual([]);
    expect(result.capabilities.allowedPaths.entries.runjs).toBeUndefined();
    expect(result.capabilities.allowedPaths.entries['js-field']).toEqual(
      expect.arrayContaining([
        'src/client/js-fields/<entryName>/index.tsx',
        'src/client/js-fields/<entryName>/**/*.{ts,tsx,js,jsx,json,md}',
      ]),
    );
    expect(result.capabilities.allowedPaths.repo).toEqual(
      expect.arrayContaining(['README.md', 'light-extension.json', 'tsconfig.json', 'src/shared/**']),
    );
  });

  it('allows future client kinds to import shared helpers and SDK type/helper imports', () => {
    const validator = new LightExtensionValidator();
    const result = validator.validateWorkspace({
      files: [
        {
          path: 'README.md',
          content: '# multi kind\n',
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
          content:
            'import type { LightExtensionSettingsContext } from "@nocobase/light-extension-sdk/shared";\nexport function formatValue(ctx: LightExtensionSettingsContext) { return String(ctx.settings ?? ""); }\n',
        },
        {
          path: 'src/client/js-fields/phone-link/index.tsx',
          content:
            'import { type LightExtensionSettingsContext, defineSettings } from "@nocobase/light-extension-sdk/client";\nimport { formatValue } from "../../../shared/format";\nexport const settings = defineSettings({ type: "object", properties: {} });\nexport default function PhoneLink(ctx: LightExtensionSettingsContext) { return formatValue(ctx); }\n',
        },
        entryDescriptor('src/client/js-fields/phone-link', 'phone-link'),
      ],
    });

    expect(result.accepted).toBe(true);
    expect(result.entries).toHaveLength(1);
    expect(result.diagnostics.filter((item) => item.code === 'import_not_allowed')).toEqual([]);
    expect(result.diagnostics).toEqual([]);
  });

  it('rejects forbidden server, cross-entry, shared-boundary, and npm imports for future client kinds', () => {
    const validator = new LightExtensionValidator();
    const result = validator.validateWorkspace({
      files: [
        {
          path: 'src/shared/bad.ts',
          content: 'import "../client/js-actions/show-message/index";\nexport const bad = true;\n',
        },
        {
          path: 'src/client/js-actions/show-message/index.ts',
          content: 'export default function showMessage() { return true; }\n',
        },
        entryDescriptor('src/client/js-actions/show-message', 'show-message'),
        {
          path: 'src/client/js-fields/phone-link/index.tsx',
          content:
            'import unsupported from "unsupported-package";\nimport "../../../server/private";\nimport "../../js-actions/show-message/index";\nexport default function PhoneLink() { return unsupported; }\n',
        },
        entryDescriptor('src/client/js-fields/phone-link', 'phone-link'),
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'import_not_allowed',
          path: 'src/shared/bad.ts',
        }),
        expect.objectContaining({
          code: 'import_not_allowed',
          path: 'src/client/js-fields/phone-link/index.tsx',
          kind: 'js-field',
        }),
      ]),
    );
    expect(result.diagnostics.filter((item) => item.code === 'import_not_allowed')).toHaveLength(4);
  });

  it('rejects empty runtime imports from SDK subpaths before compile preview', () => {
    const validator = new LightExtensionValidator();
    const result = validator.validateWorkspace({
      files: [
        {
          path: 'src/client/js-fields/phone-link/index.tsx',
          content:
            'import {} from "@nocobase/light-extension-sdk/client";\nexport default function PhoneLink() { return null; }\n',
        },
        entryDescriptor('src/client/js-fields/phone-link', 'phone-link'),
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'import_not_allowed',
        kind: 'js-field',
        message: 'Runtime import from "@nocobase/light-extension-sdk/client" must use allowed helpers',
        path: 'src/client/js-fields/phone-link/index.tsx',
      }),
    );
  });

  it('rejects the removed runjs light-extension kind as a workspace path', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        { path: 'src/client/runjs/example/index.ts', content: 'return 1;\n' },
        entryDescriptor('src/client/runjs/example', 'example'),
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.entries).toEqual([]);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'workspace_path_not_allowed',
        path: 'src/client/runjs/example/index.ts',
      }),
    );
  });
});

function entryDescriptor(root: string, key: string) {
  return {
    path: `${root}/entry.json`,
    content: JSON.stringify({ schemaVersion: 1, key }),
  };
}
