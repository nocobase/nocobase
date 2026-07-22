/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeLightExtensionSettings, setLightExtensionTopLevelSetting } from '@nocobase/runjs/settings';

import { relocateRunJSWorkspace } from '../services/MoveSourceService';
import { buildApplicationDefaultLightExtensionIdentity } from '../services/LightExtensionRepoService';

describe('Improve JS skill acceptance contract', () => {
  it('keeps a complete JS Page workspace inline until explicit relocation', () => {
    const relocated = relocateRunJSWorkspace({
      kind: 'js-page',
      entryName: 'sales-overview',
      entryTitle: 'Sales overview',
      entryPath: 'src/client/index.tsx',
      files: [
        {
          path: 'src/client/index.tsx',
          content: "import { Summary } from './components/Summary';\nctx.render(<Summary />);\n",
        },
        {
          path: 'src/client/components/Summary.tsx',
          content: 'export const Summary = () => <div />;\n',
        },
        {
          path: 'src/client/entry.json',
          content: JSON.stringify({
            schemaVersion: 1,
            key: 'stable-sales-page',
            settings: {
              title: { type: 'string', default: 'Sales' },
              compact: { type: 'boolean', default: false },
            },
          }),
        },
        {
          path: '.nocobase/runjs-source.json',
          content: JSON.stringify({ schemaVersion: 1, entry: 'src/client/index.tsx' }),
        },
      ],
    });

    expect(relocated.map((file) => file.path).sort()).toEqual([
      'src/client/js-pages/sales-overview/components/Summary.tsx',
      'src/client/js-pages/sales-overview/entry.json',
      'src/client/js-pages/sales-overview/index.tsx',
    ]);
    expect(relocated.find((file) => file.path.endsWith('/index.tsx'))?.content).toContain(
      "from './components/Summary'",
    );
    expect(JSON.parse(relocated.find((file) => file.path.endsWith('/entry.json'))?.content || '{}')).toMatchObject({
      key: 'stable-sales-page',
      settings: {
        title: { type: 'string', default: 'Sales' },
        compact: { type: 'boolean', default: false },
      },
    });
  });

  it('keeps application default repository identity stable and application-scoped', () => {
    const first = buildApplicationDefaultLightExtensionIdentity('sales-app');
    expect(buildApplicationDefaultLightExtensionIdentity('sales-app')).toEqual(first);
    expect(buildApplicationDefaultLightExtensionIdentity('support-app').repoId).not.toBe(first.repoId);
  });

  it('keeps descriptor defaults, falsy Host overrides, and default restoration equivalent', () => {
    const descriptor = {
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string', default: 'Sales' },
          compact: { type: 'boolean', default: true },
          limit: { type: 'number', default: 20 },
        },
      },
      defaults: { title: 'Sales', compact: true, limit: 20 },
    };
    const overrides = { title: '', compact: false, limit: 0 };

    expect(normalizeLightExtensionSettings(descriptor, overrides)).toEqual(overrides);
    expect(
      normalizeLightExtensionSettings(descriptor, setLightExtensionTopLevelSetting(overrides, 'limit', undefined)),
    ).toEqual({ title: '', compact: false, limit: 20 });
  });

  it('rejects path traversal before an externalization write can start', () => {
    expect(() =>
      relocateRunJSWorkspace({
        kind: 'js-block',
        entryName: 'unsafe-entry',
        entryPath: 'src/client/index.tsx',
        files: [
          { path: 'src/client/index.tsx', content: 'ctx.render(null);' },
          { path: '../server/unsafe.ts', content: 'export default {};' },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: 'LIGHT_EXTENSION_INVALID_INPUT' }));
  });
});
