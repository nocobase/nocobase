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

import { DEFAULT_LIGHT_EXTENSION_README, createDefaultLightExtensionTemplate } from '../../shared/default-template';
import type { LightExtensionKind } from '../../shared/types';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionValidator } from '../services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';

const ENTRY_CASES: Array<{ entryPath: string; kind: LightExtensionKind }> = [
  {
    entryPath: 'src/client/js-pages/hello-page/index.tsx',
    kind: 'js-page',
  },
  {
    entryPath: 'src/client/js-blocks/welcome-card/index.tsx',
    kind: 'js-block',
  },
  {
    entryPath: 'src/client/js-actions/refresh-data/index.ts',
    kind: 'js-action',
  },
  {
    entryPath: 'src/client/js-fields/status-tag/index.tsx',
    kind: 'js-field',
  },
  {
    entryPath: 'src/client/js-fields/record-status-column/index.tsx',
    kind: 'js-field',
  },
  {
    entryPath: 'src/client/js-items/form-total-preview/index.tsx',
    kind: 'js-item',
  },
];

describe('plugin-light-extension default source template', () => {
  it('provides valid templates for all five supported kinds', () => {
    const files = createDefaultLightExtensionTemplate();

    expect(new LightExtensionValidator().validateInitialFiles({ files })).toEqual([]);
    expect(new Set(ENTRY_CASES.map(({ kind }) => kind))).toEqual(
      new Set<LightExtensionKind>(['js-block', 'js-page', 'js-field', 'js-action', 'js-item']),
    );
  });

  it('includes a multi-file entry with a relative import', () => {
    const files = createDefaultLightExtensionTemplate();
    const multiFileEntry = ENTRY_CASES.find(({ entryPath }) => {
      const rootPath = entryPath.slice(0, entryPath.lastIndexOf('/'));
      const entryFiles = files.filter(
        (file) => file.path.startsWith(`${rootPath}/`) && !file.path.endsWith('/entry.json'),
      );
      return entryFiles.length > 1 && entryFiles.some((file) => /from ['"]\.\//u.test(file.content));
    });

    expect(multiFileEntry).toBeDefined();
  });

  it('returns a fresh file array for each repository', () => {
    const first = createDefaultLightExtensionTemplate();
    const second = createDefaultLightExtensionTemplate();

    first[0].content = '# Changed\n';
    expect(second[0].content).toBe(DEFAULT_LIGHT_EXTENSION_README);
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
      expect(result.artifact?.code).toEqual(expect.stringMatching(/[\s\S]*/u));
    }
  });
});
