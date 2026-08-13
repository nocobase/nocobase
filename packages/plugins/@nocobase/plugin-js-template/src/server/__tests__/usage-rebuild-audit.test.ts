/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';

import {
  createTemplateRecord,
  createJsBlockNode,
  createRepository,
  createUsageRecord,
  createJsTemplateUsageServiceFixture,
  createProjectRecord,
  stableJsonHash,
} from './usage-test-helpers';
import { JsTemplateAuditService } from '../services/JsTemplateAuditService';

describe('plugin-js-template usage rebuild audit', () => {
  it('rebuilds a JS Block root idempotently and supports dry-run root filtering', async () => {
    const pageNode = createJsBlockNode({
      uid: 'flow_js_block_rebuild',
      settings: { threshold: 7, region: 'EMEA' },
    });
    const { service, repositories } = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_js_block_rebuild: pageNode,
      },
      projects: [createProjectRecord({ id: 'jtp_sales' })],
      templates: [createTemplateRecord()],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'jsTemplate' && action === 'updateUsages') {
        return {};
      }
      return false;
    });

    const first = await service.rebuildUsages(
      { rootUid: 'flow_js_block_rebuild' },
      { requestId: 'req_js_block_rebuild', can },
    );
    const second = await service.rebuildUsages(
      { rootUid: 'flow_js_block_rebuild' },
      { requestId: 'req_js_block_rebuild_repeat', can },
    );

    expect(first).toMatchObject({ scanned: 1, upserted: 1, removed: 0, ownerMissing: 0 });
    expect(second).toMatchObject({ scanned: 1, upserted: 1, removed: 0, ownerMissing: 0 });
    expect(repositories.jsTemplateUsages.records).toHaveLength(1);
    expect(repositories.jsTemplateUsages.records[0].toJSON()).toMatchObject({
      kind: 'js-block',
      ownerKind: 'flowModel.step',
      ownerLocator: {
        modelUid: 'flow_js_block_rebuild',
        use: 'JSBlockModel',
        stepPath: ['stepParams', 'jsSettings'],
      },
      resolvedStatus: 'active',
    });

    repositories.jsTemplateUsages.records.splice(0);
    const dryRun = await service.rebuildUsages(
      { rootUid: 'flow_js_block_rebuild', dryRun: true },
      { requestId: 'req_js_block_rebuild_dry_run', can },
    );
    expect(dryRun).toMatchObject({
      dryRun: true,
      scanned: 1,
      upserted: 1,
      items: [
        expect.objectContaining({
          action: 'upsert',
          kind: 'js-block',
          ownerKind: 'flowModel.step',
          resolvedStatus: 'active',
        }),
      ],
    });
    expect(repositories.jsTemplateUsages.records).toHaveLength(0);
  });

  it('rebuilds the service-side index and removes owners that are inline or no longer usage adapters', async () => {
    const { service, repositories, recordUsageEvent } = createJsTemplateUsageServiceFixture({
      flowModels: [
        {
          uid: 'flow_active',
          options: createJsBlockNode({
            uid: 'flow_active',
            settings: {
              region: 'EMEA',
              secretPayload: 'secret-rebuild-value',
            },
          }),
        },
        {
          uid: 'flow_inline',
          options: createJsBlockNode({
            uid: 'flow_inline',
            sourceMode: 'inline',
          }),
        },
        {
          uid: 'flow_no_longer_js_block',
          options: {
            uid: 'flow_no_longer_js_block',
            use: 'BlockModel',
          },
        },
      ],
      projects: [createProjectRecord()],
      templates: [createTemplateRecord()],
      usages: [
        createUsageRecord({
          modelUid: 'flow_inline',
          id: 'jtu_inline',
        }),
        createUsageRecord({
          modelUid: 'flow_no_longer_js_block',
          id: 'jtu_no_longer_js_block',
        }),
      ],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'jsTemplate' && action === 'updateUsages') {
        return {};
      }
      return false;
    });

    const result = await service.rebuildUsages(
      {},
      {
        requestId: 'req_rebuild_index',
        can,
      },
    );

    expect(result).toMatchObject({
      scanned: 3,
      upserted: 1,
      removed: 2,
      ownerMissing: 0,
      statusCounts: {
        active: 1,
      },
    });
    expect(repositories.jsTemplateUsages.records.map((record) => record.toJSON())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ownerLocator: expect.objectContaining({
            modelUid: 'flow_active',
          }),
          resolvedStatus: 'active',
        }),
      ]),
    );
    expect(repositories.jsTemplateUsages.records.map((record) => record.get('id'))).not.toContain('jtu_inline');
    expect(repositories.jsTemplateUsages.records.map((record) => record.get('id'))).not.toContain(
      'jtu_no_longer_js_block',
    );
    expect(recordUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'usageRebuild',
        result: 'success',
        details: expect.objectContaining({
          scanned: 3,
          upserted: 1,
          removed: 2,
          ownerMissing: 0,
        }),
      }),
    );
    expect(recordUsageEvent).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(recordUsageEvent.mock.calls)).not.toContain('secret-rebuild-value');
  });

  it('records sanitized conflict audit events when settings fail the current template schema', async () => {
    const { service, repositories, recordUsageEvent } = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_invalid_settings: createJsBlockNode({
          uid: 'flow_invalid_settings',
          settings: {
            threshold: 99,
            secretPayload: 'secret-settings-value',
          },
        }),
      },
      projects: [createProjectRecord()],
      templates: [createTemplateRecord()],
    });

    await service.syncFlowModelUsagesForNodeTree(
      {
        rootUid: 'flow_invalid_settings',
        action: 'flowModels.save',
      },
      {
        requestId: 'req_invalid_settings_usage',
      },
    );

    expect(repositories.jsTemplateUsages.records[0].toJSON()).toMatchObject({
      resolvedStatus: 'settings_invalid',
      settingsHash: stableJsonHash({
        threshold: 99,
        region: 'APAC',
      }),
    });
    expect(recordUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'usageConflict',
        result: 'blocked',
        reasonCode: 'settings_invalid',
        ownerLocatorHash: expect.stringMatching(/^sha256:/),
      }),
    );
    expect(recordUsageEvent.mock.calls.map(([event]) => event.action)).toEqual(['usageConflict', 'usageRebuild']);
    expect(JSON.stringify(recordUsageEvent.mock.calls)).not.toContain('secret-settings-value');
    expect(JSON.stringify(recordUsageEvent.mock.calls)).not.toContain('flow_invalid_settings');
    expect(JSON.stringify(recordUsageEvent.mock.calls)).toContain('modelUidHash');
  });

  it('sanitizes sensitive usage audit details before persisting logs', async () => {
    const jsTemplateLogs = createRepository();
    const auditService = new JsTemplateAuditService({
      getRepository: vi.fn((name: string) => {
        if (name !== 'jsTemplateLogs') {
          throw new Error(`Unexpected repository ${name}`);
        }
        return jsTemplateLogs;
      }),
    } as never);

    await auditService.recordUsageEvent({
      action: 'usageConflict',
      result: 'blocked',
      requestId: 'req_persist_usage_audit',
      message: 'usage conflict',
      ownerLocatorHash: 'sha256:canonical-owner-hash',
      settingsHash: 'sha256:canonical-settings-hash',
      details: {
        modelUid: 'flow_secret_owner',
        ownerLocator: {
          modelUid: 'flow_secret_owner',
        },
        settings: {
          token: 'secret-settings-value',
        },
        code: 'ctx.render("secret-code-value")',
        token: 'secret-token-value',
        sourceBinding: {
          projectId: 'secret-project-id',
          templateId: 'secret-template-id',
        },
        nested: {
          settingsSchema: {
            secret: 'secret-schema-value',
          },
        },
      },
    });

    const persisted = jsTemplateLogs.records[0].toJSON();
    const serialized = JSON.stringify(persisted);
    expect(serialized).not.toContain('flow_secret_owner');
    expect(serialized).not.toContain('secret-settings-value');
    expect(serialized).not.toContain('secret-code-value');
    expect(serialized).not.toContain('secret-token-value');
    expect(serialized).not.toContain('secret-project-id');
    expect(serialized).not.toContain('secret-template-id');
    expect(serialized).not.toContain('secret-schema-value');
    expect(persisted.details).toMatchObject({
      ownerLocatorHash: 'sha256:canonical-owner-hash',
      settingsHash: 'sha256:canonical-settings-hash',
      modelUidHash: expect.stringMatching(/^sha256:/),
      ownerLocatorAuditHash: expect.stringMatching(/^sha256:/),
      settingsAuditHash: expect.stringMatching(/^sha256:/),
      codeAuditHash: expect.stringMatching(/^sha256:/),
      tokenAuditHash: expect.stringMatching(/^sha256:/),
      sourceBindingAuditHash: expect.stringMatching(/^sha256:/),
      nested: {
        settingsSchemaAuditHash: expect.stringMatching(/^sha256:/),
      },
    });
  });

  it('hashes compile paths and secret details before persisting logs', async () => {
    const jsTemplateLogs = createRepository();
    const auditService = new JsTemplateAuditService({
      getRepository: vi.fn(() => jsTemplateLogs),
    } as never);

    await auditService.recordCompileEvent({
      action: 'runtimeCompile',
      result: 'blocked',
      requestId: 'req_compile_audit_redaction',
      message: 'compile failed',
      entryPath: 'src/private/credential.ts',
      diagnosticCount: 1,
      errorCount: 1,
      warningCount: 0,
      diagnostics: [
        {
          code: 'TS1005',
          severity: 'error',
          message: 'invalid source',
          path: 'src/private/credential.ts',
        },
      ],
      details: {
        credential: 'secret-credential-value',
        nested: { env: 'secret-env-value' },
      },
    });

    const persisted = jsTemplateLogs.records[0].toJSON();
    const serialized = JSON.stringify(persisted);
    expect(serialized).not.toContain('src/private/credential.ts');
    expect(serialized).not.toContain('secret-credential-value');
    expect(serialized).not.toContain('secret-env-value');
    expect(persisted.details).toMatchObject({
      entryPathHash: expect.stringMatching(/^sha256:/),
      diagnostics: [{ pathHash: expect.stringMatching(/^sha256:/) }],
      credentialAuditHash: expect.stringMatching(/^sha256:/),
      nested: { envAuditHash: expect.stringMatching(/^sha256:/) },
    });
  });

  it('skips template target trees during rebuild and removes stale template usages', async () => {
    const { service, repositories } = createJsTemplateUsageServiceFixture({
      flowModels: [
        {
          uid: 'template_js_block',
          options: createJsBlockNode({
            uid: 'template_js_block',
          }),
        },
      ],
      flowModelTemplates: [
        {
          uid: 'tpl_sales',
          targetUid: 'template_root',
        },
      ],
      flowModelTreePaths: [
        {
          ancestor: 'template_root',
          descendant: 'template_root',
        },
        {
          ancestor: 'template_root',
          descendant: 'template_js_block',
        },
      ],
      usages: [
        createUsageRecord({
          id: 'jtu_template_js_block',
          modelUid: 'template_js_block',
        }),
      ],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'jsTemplate' && action === 'updateUsages') {
        return {};
      }
      return false;
    });

    const result = await service.rebuildUsages(
      {},
      {
        requestId: 'req_rebuild_template_target',
        can,
      },
    );

    expect(result).toMatchObject({
      scanned: 1,
      upserted: 0,
      removed: 1,
      ownerMissing: 0,
    });
    expect(repositories.jsTemplateUsages.records).toHaveLength(0);
  });

  it('records denied audit when rebuildUsages permission is missing', async () => {
    const { service, recordUsageEvent } = createJsTemplateUsageServiceFixture();
    const can = vi.fn(() => false);

    await expect(
      service.rebuildUsages(
        {},
        {
          requestId: 'req_rebuild_denied',
          actorUserId: '9',
          can,
        },
      ),
    ).rejects.toMatchObject({
      code: 'JS_TEMPLATE_PERMISSION_DENIED',
    });

    expect(recordUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'usageRebuild',
        result: 'denied',
        reasonCode: 'permission_denied',
        requestId: 'req_rebuild_denied',
        actorUserId: '9',
      }),
    );
  });

  it('removes project-scoped stale usages when an owner is rebound to another project', async () => {
    const staleUsage = createUsageRecord({
      id: 'jtu_stale_repo_a',
      modelUid: 'flow_rebound',
      projectId: 'jtp_sales',
      templateId: 'jtt_sales_kpi',
    });
    const { service, repositories } = createJsTemplateUsageServiceFixture({
      flowModels: [
        {
          uid: 'flow_rebound',
          options: createJsBlockNode({
            uid: 'flow_rebound',
            sourceBinding: {
              type: 'js-template-entry',
              projectId: 'jtp_support',
              templateId: 'jtt_support_kpi',
              kind: 'js-block',
            },
          }),
        },
      ],
      projects: [createProjectRecord({ id: 'jtp_sales' }), createProjectRecord({ id: 'jtp_support' })],
      templates: [
        createTemplateRecord({
          id: 'jtt_support_kpi',
          projectId: 'jtp_support',
        }),
      ],
      usages: [staleUsage],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'jsTemplate' && action === 'updateUsages') {
        return {};
      }
      return false;
    });

    const result = await service.rebuildUsages(
      {
        projectId: 'jtp_sales',
      },
      {
        requestId: 'req_rebuild_repo_scope',
        can,
      },
    );

    expect(result).toMatchObject({
      scanned: 1,
      upserted: 0,
      removed: 1,
    });
    expect(repositories.jsTemplateUsages.records).toHaveLength(0);
  });

  it('does not mark same-owner usages in other projects missing during project-scoped rebuild', async () => {
    const repoAUsage = createUsageRecord({
      id: 'jtu_repo_a_missing_owner',
      modelUid: 'flow_shared_missing',
      projectId: 'jtp_sales',
      templateId: 'jtt_sales_kpi',
    });
    const repoBUsage = createUsageRecord({
      id: 'jtu_repo_b_same_owner',
      modelUid: 'flow_shared_missing',
      projectId: 'jtp_support',
      templateId: 'jtt_support_kpi',
      resolvedStatus: 'active',
    });
    const { service, repositories } = createJsTemplateUsageServiceFixture({
      flowModels: [],
      usages: [repoAUsage, repoBUsage],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'jsTemplate' && action === 'updateUsages') {
        return {};
      }
      return false;
    });

    const result = await service.rebuildUsages(
      {
        projectId: 'jtp_sales',
      },
      {
        requestId: 'req_rebuild_repo_owner_missing',
        can,
      },
    );

    expect(result).toMatchObject({
      ownerMissing: 1,
      statusCounts: {
        owner_missing: 1,
      },
    });
    expect(repositories.jsTemplateUsages.records.map((record) => record.toJSON())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'jtu_repo_a_missing_owner',
          projectId: 'jtp_sales',
          resolvedStatus: 'owner_missing',
        }),
        expect.objectContaining({
          id: 'jtu_repo_b_same_owner',
          projectId: 'jtp_support',
          resolvedStatus: 'active',
        }),
      ]),
    );
  });
});
