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

import { isLightExtensionError } from '../../shared/errors';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';

describe('plugin-light-extension workspace compiler bridge permissions', () => {
  let bridge: LightExtensionWorkspaceCompilerBridge;
  let recordCompileEvent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const auditService = new LightExtensionAuditService({} as Database);
    recordCompileEvent = vi.spyOn(auditService, 'recordCompileEvent').mockResolvedValue(undefined);
    const permissionService = new LightExtensionPermissionService(auditService);
    bridge = new LightExtensionWorkspaceCompilerBridge(auditService, permissionService);
  });

  it('requires light-extension compilePreview permission when a request can-check is present', async () => {
    const compile = bridge.compileEntry(
      {
        repoId: 'ler_denied',
        kind: 'js-block',
        entryName: 'secret-block',
        entryPath: 'src/client/js-blocks/secret-block/index.tsx',
        files: [
          {
            path: 'src/client/js-blocks/secret-block/index.tsx',
            content: 'const token = "secret-code";\nctx.render(<div>{token}</div>);\n',
          },
          {
            path: 'src/client/js-blocks/secret-block/settings.json',
            content: '{"token":"secret-settings"}',
          },
        ],
      },
      {
        requestId: 'req_compile_permission_denied',
        actorUserId: '2',
        can: () => null,
      },
    );

    await expect(compile).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_PERMISSION_DENIED',
      status: 403,
    });

    expect(recordCompileEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        result: 'blocked',
        reasonCode: 'permission_denied',
        actorUserId: '2',
        requestId: 'req_compile_permission_denied',
      }),
    );
    expect(JSON.stringify(recordCompileEvent.mock.calls[0][0])).not.toContain('secret-code');
    expect(JSON.stringify(recordCompileEvent.mock.calls[0][0])).not.toContain('secret-settings');
  });

  it('allows compilePreview when the light-extension permission check succeeds', async () => {
    const result = await bridge.compileEntry(
      {
        repoId: 'ler_allowed',
        kind: 'js-block',
        entryName: 'allowed-block',
        entryPath: 'src/client/js-blocks/allowed-block/index.tsx',
        files: [
          {
            path: 'src/client/js-blocks/allowed-block/index.tsx',
            content: 'ctx.render(<div>ok</div>);\n',
          },
        ],
      },
      {
        requestId: 'req_compile_permission_allowed',
        can: (input) => (input.resource === 'lightExtension' && input.action === 'compilePreview' ? {} : null),
      },
    );

    expect(result.accepted).toBe(true);
  });

  it('keeps permission errors typed as light-extension errors', async () => {
    try {
      await bridge.compileEntry(
        {
          kind: 'js-block',
          entryPath: 'src/client/js-blocks/typed-error/index.tsx',
          files: [{ path: 'src/client/js-blocks/typed-error/index.tsx', content: 'ctx.render(null);\n' }],
        },
        {
          can: () => false,
        },
      );
      throw new Error('Expected compile permission to be denied');
    } catch (error) {
      expect(isLightExtensionError(error)).toBe(true);
      expect(error).toMatchObject({
        code: 'LIGHT_EXTENSION_PERMISSION_DENIED',
        status: 403,
      });
    }
  });
});
