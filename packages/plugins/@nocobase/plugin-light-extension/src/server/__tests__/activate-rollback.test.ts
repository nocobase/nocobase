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
import { LightExtensionPublicationService } from '../services/LightExtensionPublicationService';

describe('plugin-light-extension activate rollback', () => {
  it('activates a same-entry publication with CAS and writes activation audit', async () => {
    const { db, entryModel, recordActivationEvent } = createActivationDb();
    const service = createService(db, recordActivationEvent);

    const result = await service.activatePublication(
      {
        entryId: 'lee_sales_kpi',
        toPublicationId: 'lep_v2',
        expectedCurrentPublicationId: 'lep_v1',
      },
      {
        requestId: 'req_activate_v2',
        actorUserId: '1',
        can: () => ({}),
      },
    );

    expect(result).toMatchObject({
      entryId: 'lee_sales_kpi',
      oldPublicationId: 'lep_v1',
      activePublicationId: 'lep_v2',
      emergency: false,
    });
    expect(entryModel.update).toHaveBeenCalledWith(
      {
        activePublicationId: 'lep_v2',
      },
      expect.any(Object),
    );
    expect(recordActivationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'activatePublication',
        result: 'success',
        expectedCurrentPublicationId: 'lep_v1',
        oldPublicationId: 'lep_v1',
        newPublicationId: 'lep_v2',
      }),
    );
  });

  it('rejects CAS conflicts and cross-entry publications without changing activePublicationId', async () => {
    const cas = createActivationDb();
    const casService = createService(cas.db, cas.recordActivationEvent);

    await expect(
      casService.activatePublication(
        {
          entryId: 'lee_sales_kpi',
          toPublicationId: 'lep_v2',
          expectedCurrentPublicationId: 'lep_old',
        },
        {
          requestId: 'req_activate_cas_conflict',
          can: () => ({}),
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_LIFECYCLE_CONFLICT',
      status: 409,
    });
    expect(cas.entryModel.update).not.toHaveBeenCalled();

    const cross = createActivationDb({
      publicationEntryId: 'lee_other',
    });
    const crossService = createService(cross.db, cross.recordActivationEvent);
    await expect(
      crossService.activatePublication(
        {
          entryId: 'lee_sales_kpi',
          toPublicationId: 'lep_v2',
          expectedCurrentPublicationId: 'lep_v1',
        },
        {
          requestId: 'req_activate_cross_entry',
          can: () => ({}),
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_LIFECYCLE_CONFLICT',
      status: 409,
    });
    expect(cross.entryModel.update).not.toHaveBeenCalled();
  });

  it('blocks normal activate for disabled or missing states but allows emergency rollback with reason', async () => {
    const blockedCases = [
      {
        name: 'disabled repo and entry',
        repoLifecycleStatus: 'disabled',
        entryHealthStatus: 'disabled',
      },
      {
        name: 'missing entry',
        repoLifecycleStatus: 'enabled',
        entryHealthStatus: 'missing',
      },
      {
        name: 'archived entry',
        repoLifecycleStatus: 'enabled',
        entryHealthStatus: 'archived',
      },
      {
        name: 'archived repo',
        repoLifecycleStatus: 'archived',
        entryHealthStatus: 'ready',
      },
    ];

    for (const blockedCase of blockedCases) {
      const normal = createActivationDb({
        repoLifecycleStatus: blockedCase.repoLifecycleStatus,
        entryHealthStatus: blockedCase.entryHealthStatus,
      });
      const normalService = createService(normal.db, normal.recordActivationEvent);
      await expect(
        normalService.activatePublication(
          {
            entryId: 'lee_sales_kpi',
            toPublicationId: 'lep_v2',
            expectedCurrentPublicationId: 'lep_v1',
          },
          {
            requestId: `req_activate_${blockedCase.name.replace(/\s+/g, '_')}`,
            can: () => ({}),
          },
        ),
      ).rejects.toMatchObject({
        code: 'LIGHT_EXTENSION_LIFECYCLE_CONFLICT',
      });
      expect(normal.entryModel.update).not.toHaveBeenCalled();
    }

    const emergency = createActivationDb({
      repoLifecycleStatus: 'disabled',
      entryHealthStatus: 'disabled',
    });
    const emergencyService = createService(emergency.db, emergency.recordActivationEvent);
    const result = await emergencyService.emergencyRollback(
      {
        entryId: 'lee_sales_kpi',
        toPublicationId: 'lep_v2',
        expectedCurrentPublicationId: 'lep_v1',
        reason: 'restore stable v2',
      },
      {
        requestId: 'req_emergency_rollback',
        actorUserId: '3',
        can: (input) => (input.action === 'emergencyRollback' ? {} : null),
      },
    );

    expect(result).toMatchObject({
      activePublicationId: 'lep_v2',
      emergency: true,
    });
    expect(emergency.entryModel.update).toHaveBeenCalledWith(
      {
        activePublicationId: 'lep_v2',
      },
      expect.any(Object),
    );
    expect(emergency.recordActivationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'emergencyRollback',
        result: 'success',
        reason: 'restore stable v2',
        actorUserId: '3',
      }),
    );
  });
});

function createService(
  db: Database,
  recordActivationEvent: ReturnType<typeof vi.fn>,
): LightExtensionPublicationService {
  const auditService = new LightExtensionAuditService(db);
  vi.spyOn(auditService, 'recordActivationEvent').mockImplementation(recordActivationEvent);
  const permissionService = new LightExtensionPermissionService(auditService);
  return new LightExtensionPublicationService(db, auditService, permissionService);
}

function createActivationDb(
  options: {
    activePublicationId?: string | null;
    publicationEntryId?: string;
    repoLifecycleStatus?: string;
    entryHealthStatus?: string;
  } = {},
) {
  const entryModel = createModel({
    id: 'lee_sales_kpi',
    repoId: 'ler_sales',
    kind: 'js-block',
    healthStatus: options.entryHealthStatus || 'ready',
    activePublicationId: typeof options.activePublicationId === 'undefined' ? 'lep_v1' : options.activePublicationId,
  });
  const publicationModel = createModel({
    id: 'lep_v2',
    repoId: 'ler_sales',
    entryId: options.publicationEntryId || 'lee_sales_kpi',
    commitId: 'vsc_commit_2',
    entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
    target: 'client',
    kind: 'js-block',
    surfaceStyle: 'render',
    runtimeVersion: 'v2',
    artifact: {
      code: 'ctx.render(null);',
      version: 'v2',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      filesHash: 'files_hash_2',
      diagnostics: [],
      metadata: {},
    },
    settingsSchemaSnapshot: null,
    settingsDefaultsSnapshot: null,
    settingsSchemaHash: 'schema_hash',
    settingsDefaultsHash: 'defaults_hash',
    filesHash: 'files_hash_2',
    runtimeCodeHash: 'runtime_hash_2',
    diagnostics: [],
  });
  const repoModel = createModel({
    id: 'ler_sales',
    lifecycleStatus: options.repoLifecycleStatus || 'enabled',
  });
  const recordActivationEvent = vi.fn().mockResolvedValue(undefined);
  const db = {
    getRepository: (name: string) => {
      if (name === 'lightExtensionEntries') {
        return {
          findOne: vi.fn().mockResolvedValue(entryModel),
        };
      }
      if (name === 'lightExtensionEntryPublications') {
        return {
          findOne: vi.fn().mockResolvedValue(publicationModel),
        };
      }
      if (name === 'lightExtensionRepos') {
        return {
          findOne: vi.fn().mockResolvedValue(repoModel),
        };
      }
      if (name === 'lightExtensionLogs') {
        return {
          create: vi.fn().mockResolvedValue(createModel({})),
        };
      }

      throw new Error(`Unexpected repository ${name}`);
    },
  } as unknown as Database;

  return {
    db,
    entryModel,
    recordActivationEvent,
  };
}

function createModel(values: Record<string, unknown>): Model & { update: ReturnType<typeof vi.fn> } {
  return {
    get: (key: string) => values[key],
    update: vi.fn().mockResolvedValue(undefined),
  } as unknown as Model & { update: ReturnType<typeof vi.fn> };
}
