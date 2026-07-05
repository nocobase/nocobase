/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import type { VscPermissionHookInput } from '@nocobase/plugin-vsc-file';
import type { Application } from '@nocobase/server';
import { MockServer, createMockServer } from '@nocobase/test';
import { vi } from 'vitest';

import { LIGHT_EXTENSION_ACL_ACTIONS, LIGHT_EXTENSION_ACL_SNIPPET, NAMESPACE } from '../../constants';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import PluginLightExtensionServer from '../plugin';

describe('plugin-light-extension permission service', () => {
  it('registers the canonical lightExtension ACL actions as logged-in actions', async () => {
    const app = await createMockServer({
      acl: true,
      plugins: [PluginLightExtensionServer],
    });

    try {
      for (const action of LIGHT_EXTENSION_ACL_ACTIONS) {
        await expect(
          app.acl.allowManager.isAllowed('lightExtension', action, { state: {} }),
          `anonymous ${action}`,
        ).resolves.toBe(false);
        await expect(
          app.acl.allowManager.isAllowed('lightExtension', action, { state: { currentUser: { id: 1 } } }),
          `logged-in ${action}`,
        ).resolves.toBe(true);
      }

      await expect(
        app.acl.allowManager.isAllowed('lightExtension', 'unknownAction', {
          state: { currentUser: { id: 1 } },
        }),
      ).resolves.toBe(false);
      expect(app.acl.snippetManager.snippets.get(LIGHT_EXTENSION_ACL_SNIPPET)?.actions).toEqual(
        LIGHT_EXTENSION_ACL_ACTIONS.map((action) => `lightExtension:${action}`),
      );
    } finally {
      await app.destroy();
    }
  });

  it('registers the vsc permission hook after vsc-file becomes available later', async () => {
    let afterLoadPluginListener: ((plugin: unknown, options?: unknown) => void) | undefined;
    const registeredHooks: unknown[] = [];
    let registrar: { registerPermissionHook: ReturnType<typeof vi.fn> } | null = null;
    const on = vi.fn((eventName: string, listener: (plugin: unknown, options?: unknown) => void) => {
      if (eventName === 'afterLoadPlugin') {
        afterLoadPluginListener = listener;
      }
    });
    const off = vi.fn();
    const app = {
      db: {} as Database,
      acl: {
        allow: vi.fn(),
        registerSnippet: vi.fn(),
      },
      pm: {
        get: vi.fn(() => registrar),
        getPlugins: vi.fn(() => (registrar ? new Map([['vsc-file', registrar]]) : new Map())),
      },
      on,
      off,
    } as unknown as Application;
    const plugin = new PluginLightExtensionServer(app, {
      name: 'light-extension',
      packageName: NAMESPACE,
    });

    await plugin.load();

    expect(on).toHaveBeenCalledWith('afterLoadPlugin', expect.any(Function));
    expect(registeredHooks).toHaveLength(0);

    const unregister = vi.fn();
    registrar = {
      registerPermissionHook: vi.fn((hook: unknown) => {
        registeredHooks.push(hook);
        return unregister;
      }),
    };
    afterLoadPluginListener?.(registrar);

    expect(registrar.registerPermissionHook).toHaveBeenCalledTimes(1);
    expect(registeredHooks[0]).toEqual(expect.any(Function));
    expect(off).toHaveBeenCalledWith('afterLoadPlugin', afterLoadPluginListener);
  });

  it('ignores non-light-extension owners', async () => {
    const auditService = createAuditServiceStub();
    const service = new LightExtensionPermissionService(auditService);

    const result = await service.handleVscPermission({
      userId: '1',
      action: 'getRepository',
      repoId: 'vscr_plugin',
      ownerType: 'plugin',
      ownerId: 'demo',
    });

    expect(result).toBeUndefined();
    expect(auditService.recordRawResourceDenied).not.toHaveBeenCalled();
  });

  it('denies direct raw vscFile access and writes an allowlisted audit summary', async () => {
    const auditService = createAuditServiceStub();
    const service = new LightExtensionPermissionService(auditService);
    const input: VscPermissionHookInput = {
      userId: '1',
      action: 'push',
      repoId: 'vscr_light',
      ownerType: 'light-extension',
      ownerId: 'ler_demo',
      request: {
        resourceName: 'vscFile',
        actionName: 'push',
        requestId: 'req_raw_push',
        path: '/api/vscFile:push',
        method: 'POST',
        requestSource: 'api',
      },
      actionMetadata: {
        settings: {
          token: 'secret-settings-value',
        },
        code: 'ctx.render("secret-code")',
        sourceMap: 'secret-source-map',
      },
    };

    const result = await service.handleVscPermission(input);

    expect(result).toMatchObject({
      allowed: false,
      details: {
        ownerType: 'light-extension',
        rawResourceAction: 'vscFile:push',
        result: 'denied',
        denyReason: 'raw_resource_forbidden',
        requestId: 'req_raw_push',
      },
    });
    expect(auditService.recordRawResourceDenied).toHaveBeenCalledWith({
      permission: input,
      denyReason: 'raw_resource_forbidden',
      requestId: 'req_raw_push',
    });

    const payload = auditService.buildRawResourceDeniedPayload({
      permission: input,
      denyReason: 'raw_resource_forbidden',
    });
    expect(payload).toMatchObject({
      ownerType: 'light-extension',
      rawResourceAction: 'vscFile:push',
      result: 'denied',
      denyReason: 'raw_resource_forbidden',
      requestId: 'req_raw_push',
    });
    expect(JSON.stringify(payload)).not.toContain('secret-settings-value');
    expect(JSON.stringify(payload)).not.toContain('secret-code');
    expect(JSON.stringify(payload)).not.toContain('secret-source-map');
  });

  it('allows only explicitly allowlisted internal service actions', async () => {
    const auditService = createAuditServiceStub();
    const service = new LightExtensionPermissionService(auditService);
    const internalRequest = service.createInternalVscRequestContext({
      requestId: 'req_internal',
      reason: 'read source through light-extension API',
      lightExtensionRepoId: 'ler_demo',
      allowedActions: ['getRepository', 'pull'],
      actorUserId: '1',
      aclAction: 'readSource',
    });

    await expect(
      service.handleVscPermission({
        userId: '1',
        action: 'getRepository',
        repoId: 'vscr_light',
        ownerType: 'light-extension',
        ownerId: 'ler_demo',
        request: internalRequest,
      }),
    ).resolves.toBeUndefined();

    const denied = await service.handleVscPermission({
      userId: '1',
      action: 'push',
      repoId: 'vscr_light',
      ownerType: 'light-extension',
      ownerId: 'ler_demo',
      request: internalRequest,
    });

    expect(denied).toMatchObject({
      allowed: false,
      details: {
        denyReason: 'internal_action_not_allowed',
        requestId: 'req_internal',
      },
    });
    expect(auditService.recordRawResourceDenied).toHaveBeenCalledTimes(1);
  });

  it('keeps raw access denied when audit persistence fails', async () => {
    const auditService = createAuditServiceStub();
    vi.mocked(auditService.recordRawResourceDenied).mockRejectedValueOnce(new Error('audit unavailable'));
    const service = new LightExtensionPermissionService(auditService);

    const result = await service.handleVscPermission({
      userId: '1',
      action: 'push',
      repoId: 'vscr_light',
      ownerType: 'light-extension',
      ownerId: 'ler_demo',
      request: {
        resourceName: 'vscFile',
        actionName: 'push',
        requestId: 'req_audit_down',
      },
    });

    expect(result).toMatchObject({
      allowed: false,
      details: {
        ownerType: 'light-extension',
        rawResourceAction: 'vscFile:push',
        result: 'denied',
        denyReason: 'raw_resource_forbidden',
        requestId: 'req_audit_down',
      },
    });
  });

  function createAuditServiceStub(): LightExtensionAuditService {
    const auditService = new LightExtensionAuditService({} as Database);
    vi.spyOn(auditService, 'recordRawResourceDenied').mockResolvedValue(undefined);
    return auditService;
  }
});
