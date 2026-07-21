/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import type { VscPermissionHookInput } from '../vsc-file';
import type { Application } from '@nocobase/server';
import { vi } from 'vitest';

import { LIGHT_EXTENSION_ACL_ACTIONS, LIGHT_EXTENSION_ACL_SNIPPET, NAMESPACE } from '../../constants';
import { lightExtensionCapabilitiesActionNames } from '../resources/lightExtensionCapabilities';
import { lightExtensionContextActionNames } from '../resources/lightExtensionContexts';
import { lightExtensionEntryActionNames } from '../resources/lightExtensionEntries';
import { lightExtensionFileActionNames } from '../resources/lightExtensionFiles';
import { lightExtensionReferenceActionNames } from '../resources/lightExtensionReferences';
import { lightExtensionPreviewProblemActionNames } from '../resources/lightExtensionPreviewProblems';
import { lightExtensionActionNames } from '../resources/lightExtensions';
import { lightExtensionRepoActionNames } from '../resources/lightExtensionRepos';
import { lightExtensionRuntimeActionNames } from '../resources/lightExtensionRuntime';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import PluginLightExtensionServer from '../plugin';

describe('plugin-light-extension permission service', () => {
  it('allows logged-in runtime resolution while keeping management actions behind the management snippet', async () => {
    type RegisteredSnippet = { name: string; actions: string[] };

    const registeredSnippets: RegisteredSnippet[] = [];
    const acl = {
      allow: vi.fn(),
      registerSnippet: vi.fn((snippet: RegisteredSnippet) => {
        registeredSnippets.push(snippet);
      }),
    };
    const app = {
      db: {} as Database,
      environment: { getVariables: vi.fn(() => ({})) },
      acl,
      auditManager: {
        registerActions: vi.fn(),
        log: vi.fn(),
      },
      resourceManager: {
        define: vi.fn(),
        options: {},
      },
      on: vi.fn(),
      off: vi.fn(),
      use: vi.fn(),
    } as unknown as Application;
    const plugin = new PluginLightExtensionServer(app, {
      name: 'light-extension',
      packageName: NAMESPACE,
    });

    await plugin.load();

    expect(acl.allow).toHaveBeenCalledWith('lightExtensionRuntime', [...lightExtensionRuntimeActionNames], 'loggedIn');
    expect(acl.allow).toHaveBeenCalledWith(
      'lightExtensionPreviewProblems',
      [...lightExtensionPreviewProblemActionNames],
      'loggedIn',
    );
    expect(acl.allow).toHaveBeenCalledWith(
      'lightExtensionCapabilities',
      [...lightExtensionCapabilitiesActionNames],
      'public',
    );
    expect(acl.registerSnippet).toHaveBeenCalledTimes(1);
    expect(registeredSnippets).toContainEqual({
      name: LIGHT_EXTENSION_ACL_SNIPPET,
      actions: [
        ...LIGHT_EXTENSION_ACL_ACTIONS.map((action) => `lightExtension:${action}`),
        ...lightExtensionActionNames.map((action) => `lightExtensions:${action}`),
        ...lightExtensionReferenceActionNames.map((action) => `lightExtensionReferences:${action}`),
        ...lightExtensionContextActionNames.map((action) => `lightExtensionContexts:${action}`),
        ...lightExtensionRepoActionNames.map((action) => `lightExtensionRepos:${action}`),
        ...lightExtensionFileActionNames.map((action) => `lightExtensionFiles:${action}`),
        ...lightExtensionEntryActionNames.map((action) => `lightExtensionEntries:${action}`),
        ...lightExtensionCapabilitiesActionNames.map((action) => `lightExtensionCapabilities:${action}`),
      ],
    });
    const managementSnippet = registeredSnippets.find((snippet) => snippet.name === LIGHT_EXTENSION_ACL_SNIPPET);
    expect(managementSnippet?.actions).not.toContain('lightExtensionRuntime:resolve');
    expect(managementSnippet?.actions).not.toContain('lightExtensionPreviewProblems:append');
    expect(managementSnippet?.actions).not.toContain('lightExtension:updateMeta');
    expect(managementSnippet?.actions).not.toContain('lightExtension:viewLogs');
    expect(managementSnippet?.actions).not.toContain('lightExtension:sync');
    expect(managementSnippet?.actions).toContain('lightExtensionFiles:saveSource');
    expect(managementSnippet?.actions).toContain('lightExtensionCapabilities:get');
    expect(managementSnippet?.actions).toContain('lightExtensionContexts:get');
  });

  it('registers and removes the hosted VSC permission hook directly', async () => {
    const definedResources: Array<{ name?: string; actions?: Record<string, unknown> }> = [];
    const on = vi.fn();
    const off = vi.fn();
    const app = {
      db: {} as Database,
      environment: { getVariables: vi.fn(() => ({})) },
      acl: {
        allow: vi.fn(),
        registerSnippet: vi.fn(),
      },
      auditManager: {
        registerActions: vi.fn(),
        log: vi.fn(),
      },
      resourceManager: {
        define: vi.fn((resource: { name?: string; actions?: Record<string, unknown> }) => {
          definedResources.push(resource);
        }),
        options: {},
      },
      on,
      off,
    } as unknown as Application;
    const plugin = new PluginLightExtensionServer(app, {
      name: 'light-extension',
      packageName: NAMESPACE,
    });

    await plugin.load();

    expect(on).not.toHaveBeenCalledWith('afterLoadPlugin', expect.any(Function));
    expect(definedResources.find((resource) => resource.name === 'vscFile')).toBeDefined();
    expect(definedResources.find((resource) => resource.name === 'lightExtensions')?.actions).toHaveProperty(
      'moveToInline',
    );
    await expect(
      plugin.getPermissionHookRegistry().assertAllowed({
        userId: '1',
        action: 'getRepository',
        ownerType: 'light-extension',
        ownerId: 'ler_direct_hook',
        request: {
          resourceName: 'vscFile',
          actionName: 'getRepository',
          requestId: 'req_direct_hook',
        },
      }),
    ).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
      details: {
        ownerType: 'light-extension',
        denyReason: 'raw_resource_forbidden',
        requestId: 'req_direct_hook',
      },
    });

    await plugin.afterDisable();
    await expect(
      plugin.getPermissionHookRegistry().assertAllowed({
        userId: '1',
        action: 'getRepository',
        ownerType: 'light-extension',
        ownerId: 'ler_direct_hook',
      }),
    ).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
      details: {
        ownerType: 'light-extension',
        denyReason: 'protected_owner_requires_permission_hook',
      },
    });
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
      repository: {
        id: 'vscr_light',
        ownerType: 'light-extension',
        ownerId: 'ler_demo',
        name: 'source',
        status: 'active',
        defaultRef: 'head',
        headCommitId: null,
        headSeq: 0,
      },
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
      ownerId: 'ler_demo',
      repoId: 'ler_demo',
      rawResourceAction: 'vscFile:push',
      result: 'denied',
      denyReason: 'raw_resource_forbidden',
      requestId: 'req_raw_push',
    });
    expect(JSON.stringify(payload)).not.toContain('vscr_light');
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
    ).resolves.toMatchObject({
      allowed: true,
      ownerType: 'light-extension',
    });

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

  it('does not attribute raw create denials to claimed owner ids without a loaded repository', () => {
    const auditService = createAuditServiceStub();
    const payload = auditService.buildRawResourceDeniedPayload({
      permission: {
        userId: '1',
        action: 'createRepository',
        ownerType: 'light-extension',
        ownerId: 'ler_claimed',
        request: {
          resourceName: 'vscFile',
          actionName: 'createRepository',
          requestId: 'req_claimed_owner',
          requestSource: `api-${'x'.repeat(700)}`,
        },
      },
      denyReason: 'raw_resource_forbidden',
    });

    expect(payload.repoId).toBeUndefined();
    expect(payload.details).toMatchObject({
      claimedOwnerId: 'ler_claimed',
      rawResourceAction: 'vscFile:createRepository',
    });
    expect((payload.details.requestSource as string).length).toBeLessThanOrEqual(512);
  });

  function createAuditServiceStub(): LightExtensionAuditService {
    const auditService = new LightExtensionAuditService({} as Database);
    vi.spyOn(auditService, 'recordRawResourceDenied').mockResolvedValue(undefined);
    return auditService;
  }
});
