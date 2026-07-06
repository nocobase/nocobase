/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';
import { vi } from 'vitest';

import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionPublicationResolveService } from '../services/LightExtensionPublicationResolveService';
import {
  createEntryRecord,
  createJsBlockNode,
  createPublicationRecord,
  createReferenceServiceFixture,
  createRepoRecord,
  createSourceBinding,
} from './reference-test-helpers';

describe('plugin-light-extension follow-active policy', () => {
  it('indexes follow-active references against entry.activePublicationId while pinned stays fixed', async () => {
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_follow: createJsBlockNode({
          uid: 'flow_follow',
          sourceBinding: createSourceBinding({
            publicationId: 'lep_v1',
            versionPolicy: 'follow-active',
          }),
        }),
        flow_pinned: createJsBlockNode({
          uid: 'flow_pinned',
          sourceBinding: createSourceBinding({
            publicationId: 'lep_v1',
            versionPolicy: 'pinned',
          }),
        }),
      },
      flowModels: [
        {
          uid: 'flow_follow',
          options: createJsBlockNode({
            uid: 'flow_follow',
            sourceBinding: createSourceBinding({
              publicationId: 'lep_v1',
              versionPolicy: 'follow-active',
            }),
          }),
        },
        {
          uid: 'flow_pinned',
          options: createJsBlockNode({
            uid: 'flow_pinned',
            sourceBinding: createSourceBinding({
              publicationId: 'lep_v1',
              versionPolicy: 'pinned',
            }),
          }),
        },
      ],
      publications: [
        createPublicationRecord({ id: 'lep_v1', runtimeCodeHash: 'runtime_hash_v1' }),
        createPublicationRecord({ id: 'lep_v2', runtimeCodeHash: 'runtime_hash_v2' }),
      ],
      repos: [createRepoRecord()],
      entries: [createEntryRecord({ activePublicationId: 'lep_v2' })],
    });

    await service.syncFlowModelReferencesForNodeTree({ rootUid: 'flow_follow' });
    await service.syncFlowModelReferencesForNodeTree({ rootUid: 'flow_pinned' });

    expect(repositories.lightExtensionReferences.records.map((record) => record.toJSON())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ownerLocator: expect.objectContaining({ modelUid: 'flow_follow' }),
          publicationId: 'lep_v2',
          versionPolicy: 'follow-active',
          resolvedStatus: 'active',
        }),
        expect.objectContaining({
          ownerLocator: expect.objectContaining({ modelUid: 'flow_pinned' }),
          publicationId: 'lep_v1',
          versionPolicy: 'pinned',
          resolvedStatus: 'active',
        }),
      ]),
    );
  });

  it('resolves follow-active runtime to the current active publication and follows rollback', async () => {
    const entryModel = createModel(createEntryRecord({ activePublicationId: 'lep_v2' }));
    const publications = [
      createModel(createPublicationRecord({ id: 'lep_v1', artifact: createArtifact("ctx.render('v1');") })),
      createModel(createPublicationRecord({ id: 'lep_v2', artifact: createArtifact("ctx.render('v2');") })),
    ];
    const service = createResolveService({
      publications,
      entryModel,
    });

    const first = await service.resolveRuntime(
      {
        sourceMode: 'light-extension',
        sourceBinding: createSourceBinding({
          publicationId: 'lep_v1',
          versionPolicy: 'follow-active',
        }),
        settings: {},
      },
      { can: usePublicationOnly },
    );

    expect(first).toMatchObject({
      publicationId: 'lep_v2',
      code: "ctx.render('v2');",
      cache: {
        immutable: false,
      },
    });

    await entryModel.update({ activePublicationId: 'lep_v1' });
    const rolledBack = await service.resolveRuntime(
      {
        sourceMode: 'light-extension',
        sourceBinding: createSourceBinding({
          publicationId: 'lep_v2',
          versionPolicy: 'follow-active',
        }),
        settings: {},
      },
      { can: usePublicationOnly },
    );

    expect(rolledBack).toMatchObject({
      publicationId: 'lep_v1',
      code: "ctx.render('v1');",
    });
  });

  it('maps follow-active disabled, archived, missing, and no-active states to lifecycle errors', async () => {
    const blockedCases = [
      {
        name: 'disabled repo',
        repoLifecycleStatus: 'disabled',
        entry: createEntryRecord({ activePublicationId: 'lep_v2' }),
        reasonCode: 'repo_disabled',
      },
      {
        name: 'archived repo',
        repoLifecycleStatus: 'archived',
        entry: createEntryRecord({ activePublicationId: 'lep_v2' }),
        reasonCode: 'repo_archived',
      },
      {
        name: 'missing entry',
        repoLifecycleStatus: 'enabled',
        entry: null,
        reasonCode: 'entry_missing',
      },
      {
        name: 'no active publication',
        repoLifecycleStatus: 'enabled',
        entry: createEntryRecord({ activePublicationId: null }),
        reasonCode: 'no_active_publication',
      },
    ];

    for (const blockedCase of blockedCases) {
      const service = createResolveService({
        publications: [createModel(createPublicationRecord({ id: 'lep_v2' }))],
        entryModel: blockedCase.entry ? createModel(blockedCase.entry) : null,
        repoLifecycleStatus: blockedCase.repoLifecycleStatus,
      });

      await expect(
        service.resolveRuntime(
          {
            sourceMode: 'light-extension',
            sourceBinding: createSourceBinding({
              publicationId: 'lep_v1',
              versionPolicy: 'follow-active',
            }),
            settings: {},
          },
          { can: usePublicationOnly },
        ),
      ).rejects.toMatchObject({
        details: {
          reasonCode: blockedCase.reasonCode,
        },
      });
    }
  });
});

function createResolveService(input: {
  publications: Model[];
  entryModel: Model | null;
  repoLifecycleStatus?: string;
}) {
  const db = {
    getRepository: (name: string) => {
      if (name === 'lightExtensionEntryPublications') {
        return {
          findOne: vi.fn(({ filterByTk }: { filterByTk?: string }) =>
            Promise.resolve(input.publications.find((publication) => publication.get('id') === filterByTk) || null),
          ),
        };
      }
      if (name === 'lightExtensionRepos') {
        return {
          findOne: vi.fn().mockResolvedValue(
            createModel({
              id: 'ler_sales',
              lifecycleStatus: input.repoLifecycleStatus || 'enabled',
            }),
          ),
        };
      }
      if (name === 'lightExtensionEntries') {
        return {
          findOne: vi.fn().mockResolvedValue(input.entryModel),
        };
      }
      if (name === 'lightExtensionLogs') {
        return {
          create: vi.fn(),
        };
      }
      throw new Error(`Unexpected repository ${name}`);
    },
  } as unknown as Database;
  const auditService = new LightExtensionAuditService(db);
  const permissionService = new LightExtensionPermissionService(auditService);
  return new LightExtensionPublicationResolveService(db, auditService, permissionService);
}

function usePublicationOnly({ action }: { action: string }) {
  return action === 'usePublication' ? {} : null;
}

function createArtifact(code: string) {
  return {
    code,
    sourceMap: '{"version":3}',
    version: 'v2',
    entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
    filesHash: 'files_hash_1',
    diagnostics: [],
    metadata: {},
  };
}

function createModel(
  values: Record<string, unknown>,
): Model & { update: (next: Record<string, unknown>) => Promise<void> } {
  const state = { ...values };
  return {
    get: (key: string) => state[key],
    update: vi.fn(async (next: Record<string, unknown>) => {
      Object.assign(state, next);
    }),
  } as unknown as Model & { update: (next: Record<string, unknown>) => Promise<void> };
}
