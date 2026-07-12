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

import {
  DEFAULT_LIGHT_EXTENSION_README,
  DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES,
  createDefaultLightExtensionTemplate,
} from '../../shared/default-template';
import type { LightExtensionKind } from '../../shared/types';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionValidator } from '../services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';

describe('plugin-light-extension default source template', () => {
  it('contains the simple multi-kind example layout and passes source validation', () => {
    const files = createDefaultLightExtensionTemplate();
    const paths = files.map((file) => file.path);
    const diagnostics = new LightExtensionValidator().validateInitialFiles({ files });

    expect(paths).toEqual([
      'README.md',
      'tsconfig.json',
      'src/shared/light-extension-sdk.d.ts',
      'src/client/js-blocks/example/index.tsx',
      'src/client/js-blocks/example/meta.json',
      'src/client/js-actions/example/index.ts',
      'src/client/js-actions/example/meta.json',
      'src/client/js-fields/example/index.tsx',
      'src/client/js-fields/example/meta.json',
      'src/client/js-items/example/index.tsx',
      'src/client/js-items/example/meta.json',
      'src/client/runjs/example/index.ts',
      'src/client/runjs/example/meta.json',
    ]);
    expect(diagnostics).toEqual([]);
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('src/client/js-blocks/<entry-name>/index.tsx');
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('src/client/js-actions/<entry-name>/index.ts');
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('src/client/js-fields/<entry-name>/index.tsx');
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('src/client/js-items/<entry-name>/index.tsx');
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('src/client/runjs/<entry-name>/index.ts');
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('meta.json.key');
    expect(
      files.filter((file) => file.path.endsWith('/index.tsx')).every((file) => file.language === 'typescript'),
    ).toBe(true);
    expect(files.filter((file) => file.path.endsWith('/meta.json')).every((file) => file.language === 'json')).toBe(
      true,
    );
    expect(DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES).toHaveLength(13);
  });

  it('returns a fresh file array for each repository', () => {
    const first = createDefaultLightExtensionTemplate();
    const second = createDefaultLightExtensionTemplate();

    first[0].content = '# Changed\n';
    expect(second[0].content).toBe(DEFAULT_LIGHT_EXTENSION_README);
  });

  it('compiles every default example entry', async () => {
    const auditService = new LightExtensionAuditService({} as Database);
    vi.spyOn(auditService, 'recordCompileEvent').mockResolvedValue(undefined);
    const bridge = new LightExtensionWorkspaceCompilerBridge(
      auditService,
      new LightExtensionPermissionService(auditService),
    );
    const cases: Array<{ kind: LightExtensionKind; entryPath: string }> = [
      { kind: 'js-block', entryPath: 'src/client/js-blocks/example/index.tsx' },
      { kind: 'js-action', entryPath: 'src/client/js-actions/example/index.ts' },
      { kind: 'js-field', entryPath: 'src/client/js-fields/example/index.tsx' },
      { kind: 'js-item', entryPath: 'src/client/js-items/example/index.tsx' },
      { kind: 'runjs', entryPath: 'src/client/runjs/example/index.ts' },
    ];

    for (const item of cases) {
      const rootPath = item.entryPath.slice(0, item.entryPath.lastIndexOf('/'));
      const result = await bridge.compileEntry({
        repoId: 'ler_default',
        kind: item.kind,
        entryName: 'example',
        entryPath: item.entryPath,
        files: createDefaultLightExtensionTemplate().filter(
          (file) => file.path.startsWith(`${rootPath}/`) || file.path.startsWith('src/shared/'),
        ),
      });

      expect(result.accepted, item.kind).toBe(true);
      expect(result.diagnostics, item.kind).toEqual([]);
    }
  });
});
