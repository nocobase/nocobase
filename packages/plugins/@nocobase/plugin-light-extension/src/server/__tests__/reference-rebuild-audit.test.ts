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
  createEntryRecord,
  createJsBlockNode,
  createRepository,
  createReferenceRecord,
  createReferenceServiceFixture,
  createRepoRecord,
  stableJsonHash,
} from './reference-test-helpers';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';

describe('plugin-light-extension reference rebuild audit', () => {
  it('rebuilds the service-side index, removes inline references, and marks non-JSBlock owners missing', async () => {
    const { service, repositories, recordReferenceEvent } = createReferenceServiceFixture({
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
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
      references: [
        createReferenceRecord({
          modelUid: 'flow_inline',
          id: 'lef_inline',
        }),
        createReferenceRecord({
          modelUid: 'flow_no_longer_js_block',
          id: 'lef_no_longer_js_block',
        }),
      ],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'lightExtension' && action === 'updateReferences') {
        return {};
      }
      return false;
    });

    const result = await service.rebuildIndex(
      {},
      {
        requestId: 'req_rebuild_index',
        can,
      },
    );

    expect(result).toMatchObject({
      scanned: 2,
      upserted: 1,
      removed: 1,
      ownerMissing: 1,
      statusCounts: {
        active: 1,
        owner_missing: 1,
      },
    });
    expect(repositories.lightExtensionReferences.records.map((record) => record.toJSON())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ownerLocator: expect.objectContaining({
            modelUid: 'flow_active',
          }),
          resolvedStatus: 'active',
        }),
        expect.objectContaining({
          id: 'lef_no_longer_js_block',
          resolvedStatus: 'owner_missing',
        }),
      ]),
    );
    expect(repositories.lightExtensionReferences.records.map((record) => record.get('id'))).not.toContain('lef_inline');
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'referenceRebuild',
        result: 'success',
        details: expect.objectContaining({
          scanned: 2,
          upserted: 1,
          removed: 1,
          ownerMissing: 1,
        }),
      }),
    );
    expect(JSON.stringify(recordReferenceEvent.mock.calls)).not.toContain('secret-rebuild-value');
  });

  it('records sanitized conflict audit events when settings fail the entry current schema', async () => {
    const { service, repositories, recordReferenceEvent } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_invalid_settings: createJsBlockNode({
          uid: 'flow_invalid_settings',
          settings: {
            threshold: 99,
            secretPayload: 'secret-settings-value',
          },
        }),
      },
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
    });

    await service.syncFlowModelReferencesForNodeTree(
      {
        rootUid: 'flow_invalid_settings',
        action: 'flowModels.save',
      },
      {
        requestId: 'req_invalid_settings_reference',
      },
    );

    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      resolvedStatus: 'settings_invalid',
      settingsHash: stableJsonHash({
        threshold: 99,
        region: 'APAC',
      }),
    });
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'referenceConflict',
        result: 'blocked',
        reasonCode: 'settings_invalid',
        ownerLocatorHash: expect.stringMatching(/^sha256:/),
      }),
    );
    expect(JSON.stringify(recordReferenceEvent.mock.calls)).not.toContain('secret-settings-value');
    expect(JSON.stringify(recordReferenceEvent.mock.calls)).not.toContain('flow_invalid_settings');
    expect(JSON.stringify(recordReferenceEvent.mock.calls)).toContain('modelUidHash');
  });

  it('sanitizes sensitive reference audit details before persisting logs', async () => {
    const lightExtensionLogs = createRepository();
    const auditService = new LightExtensionAuditService({
      getRepository: vi.fn((name: string) => {
        if (name !== 'lightExtensionLogs') {
          throw new Error(`Unexpected repository ${name}`);
        }
        return lightExtensionLogs;
      }),
    } as never);

    await auditService.recordReferenceEvent({
      action: 'referenceConflict',
      result: 'blocked',
      requestId: 'req_persist_reference_audit',
      message: 'reference conflict',
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
        nested: {
          settingsSchema: {
            secret: 'secret-schema-value',
          },
        },
      },
    });

    const persisted = lightExtensionLogs.records[0].toJSON();
    const serialized = JSON.stringify(persisted);
    expect(serialized).not.toContain('flow_secret_owner');
    expect(serialized).not.toContain('secret-settings-value');
    expect(serialized).not.toContain('secret-schema-value');
    expect(persisted.details).toMatchObject({
      ownerLocatorHash: 'sha256:canonical-owner-hash',
      settingsHash: 'sha256:canonical-settings-hash',
      modelUidHash: expect.stringMatching(/^sha256:/),
      ownerLocatorAuditHash: expect.stringMatching(/^sha256:/),
      settingsAuditHash: expect.stringMatching(/^sha256:/),
      nested: {
        settingsSchemaAuditHash: expect.stringMatching(/^sha256:/),
      },
    });
  });

  it('skips template target trees during rebuild and removes stale template references', async () => {
    const { service, repositories } = createReferenceServiceFixture({
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
      references: [
        createReferenceRecord({
          id: 'lef_template_js_block',
          modelUid: 'template_js_block',
        }),
      ],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'lightExtension' && action === 'updateReferences') {
        return {};
      }
      return false;
    });

    const result = await service.rebuildIndex(
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
    expect(repositories.lightExtensionReferences.records).toHaveLength(0);
  });

  it('records denied audit when rebuildIndex permission is missing', async () => {
    const { service, recordReferenceEvent } = createReferenceServiceFixture();
    const can = vi.fn(() => false);

    await expect(
      service.rebuildIndex(
        {},
        {
          requestId: 'req_rebuild_denied',
          actorUserId: '9',
          can,
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_PERMISSION_DENIED',
    });

    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'referenceRebuild',
        result: 'denied',
        reasonCode: 'permission_denied',
        requestId: 'req_rebuild_denied',
        actorUserId: '9',
      }),
    );
  });

  it('removes repo-scoped stale references when an owner is rebound to another repo', async () => {
    const staleReference = createReferenceRecord({
      id: 'lef_stale_repo_a',
      modelUid: 'flow_rebound',
      repoId: 'ler_sales',
      entryId: 'lee_sales_kpi',
    });
    const { service, repositories } = createReferenceServiceFixture({
      flowModels: [
        {
          uid: 'flow_rebound',
          options: createJsBlockNode({
            uid: 'flow_rebound',
            sourceBinding: {
              type: 'light-extension-entry',
              repoId: 'ler_support',
              entryId: 'lee_support_kpi',
              kind: 'js-block',
            },
          }),
        },
      ],
      repos: [createRepoRecord({ id: 'ler_sales' }), createRepoRecord({ id: 'ler_support' })],
      entries: [
        createEntryRecord({
          id: 'lee_support_kpi',
          repoId: 'ler_support',
        }),
      ],
      references: [staleReference],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'lightExtension' && action === 'updateReferences') {
        return {};
      }
      return false;
    });

    const result = await service.rebuildIndex(
      {
        repoId: 'ler_sales',
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
    expect(repositories.lightExtensionReferences.records).toHaveLength(0);
  });

  it('does not mark same-owner references in other repos missing during repo-scoped rebuild', async () => {
    const repoAReference = createReferenceRecord({
      id: 'lef_repo_a_missing_owner',
      modelUid: 'flow_shared_missing',
      repoId: 'ler_sales',
      entryId: 'lee_sales_kpi',
    });
    const repoBReference = createReferenceRecord({
      id: 'lef_repo_b_same_owner',
      modelUid: 'flow_shared_missing',
      repoId: 'ler_support',
      entryId: 'lee_support_kpi',
      resolvedStatus: 'active',
    });
    const { service, repositories } = createReferenceServiceFixture({
      flowModels: [],
      references: [repoAReference, repoBReference],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'lightExtension' && action === 'updateReferences') {
        return {};
      }
      return false;
    });

    const result = await service.rebuildIndex(
      {
        repoId: 'ler_sales',
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
    expect(repositories.lightExtensionReferences.records.map((record) => record.toJSON())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'lef_repo_a_missing_owner',
          repoId: 'ler_sales',
          resolvedStatus: 'owner_missing',
        }),
        expect.objectContaining({
          id: 'lef_repo_b_same_owner',
          repoId: 'ler_support',
          resolvedStatus: 'active',
        }),
      ]),
    );
  });
});
