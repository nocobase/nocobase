/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { vi } from 'vitest';

import enUS from '../../locale/en-US.json';
import zhCN from '../../locale/zh-CN.json';
import { DEFAULT_LIGHT_EXTENSION_README, createDefaultLightExtensionTemplate } from '../../shared/default-template';
import type { LightExtensionKind } from '../../shared/types';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionValidator } from '../services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';

const ENTRY_CASES: Array<{ category: string; entryPath: string; kind: LightExtensionKind }> = [
  {
    category: 'js-page',
    entryPath: 'src/client/js-pages/hello-page/index.tsx',
    kind: 'js-page',
  },
  {
    category: 'examples',
    entryPath: 'src/client/js-blocks/welcome-card/index.tsx',
    kind: 'js-block',
  },
  {
    category: 'examples',
    entryPath: 'src/client/js-actions/refresh-data/index.ts',
    kind: 'js-action',
  },
  {
    category: 'js-field',
    entryPath: 'src/client/js-fields/status-tag/index.tsx',
    kind: 'js-field',
  },
  {
    category: 'js-column',
    entryPath: 'src/client/js-fields/record-status-column/index.tsx',
    kind: 'js-field',
  },
  {
    category: 'js-item',
    entryPath: 'src/client/js-items/form-total-preview/index.tsx',
    kind: 'js-item',
  },
  {
    category: 'runjs',
    entryPath: 'src/client/runjs/calculate-subtotal/index.ts',
    kind: 'runjs',
  },
];

describe('plugin-light-extension default source template', () => {
  it('keeps one valid example per supported surface', () => {
    const files = createDefaultLightExtensionTemplate();
    const paths = files.map((file) => file.path);
    const pathSet = new Set(paths);

    expect(pathSet.size).toBe(paths.length);
    expect(new LightExtensionValidator().validateInitialFiles({ files })).toEqual([]);
    expect(pathSet.has('README.md')).toBe(true);
    expect(pathSet.has('tsconfig.json')).toBe(true);
    expect(paths.some((path) => path.includes('/collection-') || path.includes('/create-form/'))).toBe(false);
    expect(paths.some((path) => path.includes('/edit-form/') || path.includes('/details/'))).toBe(false);

    const categories: string[] = [];
    const keys = new Set<string>();
    for (const item of ENTRY_CASES) {
      const rootPath = item.entryPath.slice(0, item.entryPath.lastIndexOf('/'));
      const descriptorPath = `${rootPath}/entry.json`;
      const descriptorFile = files.find((file) => file.path === descriptorPath);
      const descriptor = JSON.parse(descriptorFile?.content || '{}') as Record<string, unknown>;

      expect(pathSet.has(item.entryPath)).toBe(true);
      expect(descriptor).toEqual(
        expect.objectContaining({
          category: item.category,
          description: expect.any(String),
          key: expect.any(String),
          schemaVersion: 1,
          settings: expect.any(Object),
          title: expect.any(String),
        }),
      );
      categories.push(String(descriptor.category));
      keys.add(String(descriptor.key));
    }

    expect(keys.size).toBe(ENTRY_CASES.length);
    expect(categories.filter((category) => category === 'js-page')).toHaveLength(1);
    expect(categories.filter((category) => category === 'js-field')).toHaveLength(1);
    expect(categories.filter((category) => category === 'js-column')).toHaveLength(1);
    expect(categories.filter((category) => category === 'js-item')).toHaveLength(1);
    expect(categories.filter((category) => category === 'runjs')).toHaveLength(1);
  });

  it('uses a single multi-file entry to demonstrate local imports', () => {
    const files = createDefaultLightExtensionTemplate();
    const multiFileEntries = ENTRY_CASES.filter(({ entryPath }) => {
      const rootPath = entryPath.slice(0, entryPath.lastIndexOf('/'));
      return (
        files.filter((file) => file.path.startsWith(`${rootPath}/`) && !file.path.endsWith('/entry.json')).length > 1
      );
    });

    expect(multiFileEntries).toEqual([ENTRY_CASES[0]]);
    expect(files.find((file) => file.path === ENTRY_CASES[0].entryPath)?.content).toContain(
      "import { getPageDetails } from './page-details';",
    );
  });

  it('returns a fresh file array for each repository', () => {
    const first = createDefaultLightExtensionTemplate();
    const second = createDefaultLightExtensionTemplate();

    first[0].content = '# Changed\n';
    expect(second[0].content).toBe(DEFAULT_LIGHT_EXTENSION_README);
  });

  it('keeps the JS Page example locale keys in parity', () => {
    expect(Object.keys(enUS).sort()).toEqual(Object.keys(zhCN).sort());
    expect(enUS['Hello from a JS Page']).toBe('Hello from a JS Page');
    expect(zhCN['Hello from a JS Page']).toBe('来自 JS 页面的问候');
    expect(enUS['Refresh page']).toBe('Refresh page');
    expect(zhCN['Refresh page']).toBe('刷新页面');
  });

  it('compiles every default example with the real compiler', async () => {
    const auditService = new LightExtensionAuditService({} as Database);
    vi.spyOn(auditService, 'recordCompileEvent').mockResolvedValue(undefined);
    const bridge = new LightExtensionWorkspaceCompilerBridge(
      auditService,
      new LightExtensionPermissionService(auditService),
    );
    const files = createDefaultLightExtensionTemplate();

    for (const item of ENTRY_CASES) {
      const rootPath = item.entryPath.slice(0, item.entryPath.lastIndexOf('/'));
      const result = await bridge.compileEntry({
        repoId: 'ler_default',
        kind: item.kind,
        entryName: rootPath.slice(rootPath.lastIndexOf('/') + 1),
        entryPath: item.entryPath,
        files: files.filter((file) => file.path.startsWith(`${rootPath}/`)),
      });

      expect(result.accepted, `${item.kind}:${item.entryPath}\n${JSON.stringify(result.diagnostics, null, 2)}`).toBe(
        true,
      );
      expect(result.diagnostics).toEqual([]);
      expect(result.artifact?.code).toEqual(expect.any(String));
    }
  });
});
