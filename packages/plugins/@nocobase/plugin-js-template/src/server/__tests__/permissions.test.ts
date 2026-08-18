/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import type { VscPermissionHookInput } from '@nocobase/runjs/workspace/server';
import { AuditManager, type Application } from '@nocobase/server';
import { vi } from 'vitest';

import { JS_TEMPLATE_ACL_ACTIONS, JS_TEMPLATE_ACL_SNIPPET, NAMESPACE } from '../../constants';
import { jsTemplateCapabilitiesActionNames } from '../resources/jsTemplateCapabilities';
import { jsTemplateCreateJobActionNames } from '../resources/jsTemplateCreateJobs';
import { jsTemplateActionNames } from '../resources/jsTemplates';
import { jsTemplateFileActionNames } from '../resources/jsTemplateFiles';
import { jsTemplateUsageActionNames } from '../resources/jsTemplateUsages';
import { jsTemplateProjectActionNames } from '../resources/jsTemplateProjects';
import { jsTemplateRuntimeActionNames } from '../resources/jsTemplateRuntime';
import { JsTemplateAuditService } from '../services/JsTemplateAuditService';
import { JsTemplatePermissionService } from '../services/JsTemplatePermissionService';
import { remoteInternalResourceNames } from '../vsc-file/remotes/resource';
import PluginJsTemplateServer from '../plugin';

describe('plugin-js-template permission service', () => {
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
      auditManager: new AuditManager(),
      resourceManager: {
        define: vi.fn(),
        options: {},
      },
      on: vi.fn(),
      off: vi.fn(),
      use: vi.fn(),
    } as unknown as Application;
    const plugin = new PluginJsTemplateServer(app, {
      name: 'js-template',
      packageName: NAMESPACE,
    });

    await plugin.load();

    expect(acl.allow).toHaveBeenCalledWith('jsTemplateRuntime', [...jsTemplateRuntimeActionNames], 'loggedIn');
    expect(acl.allow).toHaveBeenCalledWith('jsTemplateCapabilities', [...jsTemplateCapabilitiesActionNames], 'public');
    expect(acl.registerSnippet).toHaveBeenCalledTimes(1);
    expect(registeredSnippets).toContainEqual({
      name: JS_TEMPLATE_ACL_SNIPPET,
      actions: [
        ...JS_TEMPLATE_ACL_ACTIONS.map((action) => `jsTemplate:${action}`),
        ...jsTemplateActionNames.map((action) => `jsTemplates:${action}`),
        ...jsTemplateUsageActionNames.map((action) => `jsTemplateUsages:${action}`),
        ...jsTemplateProjectActionNames.map((action) => `jsTemplateProjects:${action}`),
        ...jsTemplateCreateJobActionNames.map((action) => `jsTemplateCreateJobs:${action}`),
        ...jsTemplateFileActionNames.map((action) => `jsTemplateFiles:${action}`),
        ...jsTemplateCapabilitiesActionNames.map((action) => `jsTemplateCapabilities:${action}`),
      ],
    });
    const managementSnippet = registeredSnippets.find((snippet) => snippet.name === JS_TEMPLATE_ACL_SNIPPET);
    expect(managementSnippet?.actions).not.toContain('jsTemplateRuntime:resolve');
    expect(managementSnippet?.actions).not.toContain('jsTemplate:updateMeta');
    expect(managementSnippet?.actions).not.toContain('jsTemplate:viewLogs');
    expect(managementSnippet?.actions).not.toContain('jsTemplate:sync');
    expect(managementSnippet?.actions).not.toContain('jsTemplates:listCatalog');
    expect(managementSnippet?.actions).not.toContain('jsTemplateProjects:addTemplate');
    expect(managementSnippet?.actions).toContain('jsTemplates:listSelectable');
    expect(managementSnippet?.actions).toContain('jsTemplates:delete');
    expect(managementSnippet?.actions).toContain('jsTemplateUsages:listUsages');
    expect(managementSnippet?.actions).toContain('jsTemplateUsages:rebuildUsages');
    expect(managementSnippet?.actions).toContain('jsTemplateFiles:saveSource');
    expect(managementSnippet?.actions).toContain('jsTemplateCapabilities:get');
  });

  it('registers and removes the hosted VSC permission hook directly', async () => {
    const definedResources: Array<{ name?: string; actions?: Record<string, unknown> }> = [];
    const removedResources: string[] = [];
    const on = vi.fn();
    const off = vi.fn();
    const app = {
      db: {} as Database,
      environment: { getVariables: vi.fn(() => ({})) },
      acl: {
        allow: vi.fn(),
        registerSnippet: vi.fn(),
      },
      auditManager: new AuditManager(),
      resourceManager: {
        define: vi.fn((resource: { name?: string; actions?: Record<string, unknown> }) => {
          definedResources.push(resource);
        }),
        removeResource: vi.fn((name: string) => {
          removedResources.push(name);
          return true;
        }),
        options: {},
      },
      on,
      off,
    } as unknown as Application;
    const plugin = new PluginJsTemplateServer(app, {
      name: 'js-template',
      packageName: NAMESPACE,
    });

    await plugin.load();

    expect(on).not.toHaveBeenCalledWith('afterLoadPlugin', expect.any(Function));
    expect(definedResources.find((resource) => resource.name === 'vscFile')).toBeUndefined();
    expect(definedResources.find((resource) => resource.name === 'runJSSources')).toBeDefined();
    expect(definedResources.find((resource) => resource.name === 'jsTemplates')?.actions).toHaveProperty(
      'detachToInline',
    );
    await expect(
      plugin.getPermissionHookRegistry().assertAllowed({
        userId: '1',
        action: 'getRepository',
        ownerType: 'js-template',
        ownerId: 'jtp_direct_hook',
        request: {
          resourceName: 'vscFile',
          actionName: 'getRepository',
          requestId: 'req_direct_hook',
        },
      }),
    ).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
      details: {
        ownerType: 'js-template',
        denyReason: 'raw_resource_forbidden',
        requestId: 'req_direct_hook',
      },
    });

    await plugin.afterDisable();
    expect(removedResources).toEqual(
      expect.arrayContaining([
        'runJSSources',
        'jsTemplates',
        'jsTemplateRuntime',
        'jsTemplateUsages',
        'jsTemplateProjects',
        'jsTemplateFiles',
        'jsTemplateCapabilities',
        'jsTemplateSync',
        'jsTemplateCreateJobs',
        ...remoteInternalResourceNames,
      ]),
    );
    await expect(
      plugin.getPermissionHookRegistry().assertAllowed({
        userId: '1',
        action: 'getRepository',
        ownerType: 'js-template',
        ownerId: 'jtp_direct_hook',
      }),
    ).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
      details: {
        ownerType: 'js-template',
        denyReason: 'protected_owner_requires_permission_hook',
      },
    });
  });

  it('ignores non-js-template owners', async () => {
    const auditService = createAuditServiceStub();
    const service = new JsTemplatePermissionService(auditService);

    const result = await service.handleVscPermission({
      userId: '1',
      action: 'getRepository',
      projectId: 'vscr_plugin',
      ownerType: 'plugin',
      ownerId: 'demo',
    });

    expect(result).toBeUndefined();
    expect(auditService.recordRawResourceDenied).not.toHaveBeenCalled();
  });

  it('denies direct raw vscFile access and writes an allowlisted audit summary', async () => {
    const auditService = createAuditServiceStub();
    const service = new JsTemplatePermissionService(auditService);
    const input: VscPermissionHookInput = {
      userId: '1',
      action: 'push',
      projectId: 'vscr_light',
      repository: {
        id: 'vscr_light',
        ownerType: 'js-template',
        ownerId: 'jtp_demo',
        name: 'source',
        status: 'active',
        defaultRef: 'head',
        headCommitId: null,
        headSeq: 0,
      },
      ownerType: 'js-template',
      ownerId: 'jtp_demo',
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
        ownerType: 'js-template',
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
      ownerType: 'js-template',
      ownerId: 'jtp_demo',
      projectId: 'jtp_demo',
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
    const service = new JsTemplatePermissionService(auditService);
    const internalRequest = service.createInternalVscRequestContext({
      requestId: 'req_internal',
      reason: 'read source through js-template API',
      jsTemplateProjectId: 'jtp_demo',
      allowedActions: ['getRepository', 'pull'],
      actorUserId: '1',
      aclAction: 'readSource',
    });

    await expect(
      service.handleVscPermission({
        userId: '1',
        action: 'getRepository',
        projectId: 'vscr_light',
        ownerType: 'js-template',
        ownerId: 'jtp_demo',
        request: internalRequest,
      }),
    ).resolves.toMatchObject({
      allowed: true,
      ownerType: 'js-template',
    });

    const denied = await service.handleVscPermission({
      userId: '1',
      action: 'push',
      projectId: 'vscr_light',
      ownerType: 'js-template',
      ownerId: 'jtp_demo',
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
    const service = new JsTemplatePermissionService(auditService);

    const result = await service.handleVscPermission({
      userId: '1',
      action: 'push',
      projectId: 'vscr_light',
      ownerType: 'js-template',
      ownerId: 'jtp_demo',
      request: {
        resourceName: 'vscFile',
        actionName: 'push',
        requestId: 'req_audit_down',
      },
    });

    expect(result).toMatchObject({
      allowed: false,
      details: {
        ownerType: 'js-template',
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
        ownerType: 'js-template',
        ownerId: 'jtp_claimed',
        request: {
          resourceName: 'vscFile',
          actionName: 'createRepository',
          requestId: 'req_claimed_owner',
          requestSource: `api-${'x'.repeat(700)}`,
        },
      },
      denyReason: 'raw_resource_forbidden',
    });

    expect(payload.projectId).toBeUndefined();
    expect(payload.details).toMatchObject({
      claimedOwnerId: 'jtp_claimed',
      rawResourceAction: 'vscFile:createRepository',
    });
    expect((payload.details.requestSource as string).length).toBeLessThanOrEqual(512);
  });

  function createAuditServiceStub(): JsTemplateAuditService {
    const auditService = new JsTemplateAuditService({} as Database);
    vi.spyOn(auditService, 'recordRawResourceDenied').mockResolvedValue(undefined);
    return auditService;
  }
});
