/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createEntryRecord,
  createPublicationRecord,
  createReferenceRecord,
  createReferenceServiceFixture,
  createRepoRecord,
  createSourceBinding,
  stableJsonHash,
} from './reference-test-helpers';

describe('plugin-light-extension bulk upgrade permissions', () => {
  it('requires updateReferences before bulk upgrade', async () => {
    const { bulkUpgradeService, recordReferenceEvent } = createReferenceServiceFixture({
      publications: [createPublicationRecord({ id: 'lep_v2' })],
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
      references: [createReferenceRecord({ id: 'lef_selected', publicationId: 'lep_v1' })],
    });

    await expect(
      bulkUpgradeService.bulkUpgrade(
        {
          toPublicationId: 'lep_v2',
          referenceIds: ['lef_selected'],
          expectedPublicationIdByReference: {
            lef_selected: 'lep_v1',
          },
          expectedSettingsHashByReference: {
            lef_selected: stableJsonHash({}),
          },
        },
        {
          requestId: 'req_update_denied',
          can: allowLightExtensionActions(['usePublication']),
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_PERMISSION_DENIED',
    });

    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'referenceBulkUpgrade',
        result: 'denied',
        reasonCode: 'permission_denied',
        details: expect.objectContaining({
          permissionAction: 'updateReferences',
        }),
      }),
    );
  });

  it('requires usePublication for the target publication before bulk upgrade', async () => {
    const { bulkUpgradeService, recordReferenceEvent } = createReferenceServiceFixture({
      publications: [createPublicationRecord({ id: 'lep_v2' })],
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
      references: [createReferenceRecord({ id: 'lef_selected', publicationId: 'lep_v1' })],
    });

    await expect(
      bulkUpgradeService.bulkUpgrade(
        {
          toPublicationId: 'lep_v2',
          referenceIds: ['lef_selected'],
          expectedPublicationIdByReference: {
            lef_selected: 'lep_v1',
          },
          expectedSettingsHashByReference: {
            lef_selected: stableJsonHash({}),
          },
        },
        {
          requestId: 'req_use_denied',
          can: allowLightExtensionActions(['updateReferences']),
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_PERMISSION_DENIED',
    });

    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'referenceBulkUpgrade',
        result: 'denied',
        reasonCode: 'permission_denied',
        publicationId: 'lep_v2',
        details: expect.objectContaining({
          permissionAction: 'usePublication',
        }),
      }),
    );
  });

  it('does not expose or update references whose owner FlowModel is not visible', async () => {
    const { bulkUpgradeService, repositories, recordReferenceEvent } = createReferenceServiceFixture({
      flowModels: [createFlowModelRecord('flow_hidden', 'lep_v1', {})],
      publications: [createPublicationRecord({ id: 'lep_v1' }), createPublicationRecord({ id: 'lep_v2' })],
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
      references: [createReferenceRecord({ id: 'lef_hidden', modelUid: 'flow_hidden', publicationId: 'lep_v1' })],
    });

    const impact = await bulkUpgradeService.analyzeImpact(
      {
        toPublicationId: 'lep_v2',
        referenceIds: ['lef_hidden'],
      },
      {
        requestId: 'req_hidden_impact',
        can: denyFlowModelRead(['readReferences', 'usePublication']),
      },
    );

    expect(impact.references).toEqual([]);
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'referenceImpact',
        result: 'denied',
        reasonCode: 'owner_not_visible',
        ownerLocatorHash: expect.any(String),
      }),
    );

    const result = await bulkUpgradeService.bulkUpgrade(
      {
        toPublicationId: 'lep_v2',
        referenceIds: ['lef_hidden'],
        expectedPublicationIdByReference: {
          lef_hidden: 'lep_v1',
        },
        expectedSettingsHashByReference: {
          lef_hidden: stableJsonHash({}),
        },
      },
      {
        requestId: 'req_hidden_bulk',
        can: denyFlowModelRead(['updateReferences', 'usePublication']),
      },
    );

    expect(result.items[0]).toMatchObject({
      referenceId: 'lef_hidden',
      status: 'skipped',
      reasonCode: 'owner_not_visible',
    });
    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      publicationId: 'lep_v1',
    });
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'referenceBulkUpgrade',
        result: 'denied',
        reasonCode: 'owner_not_visible',
        ownerLocatorHash: expect.any(String),
      }),
    );
    expect(JSON.stringify(recordReferenceEvent.mock.calls)).not.toContain('flow_hidden');
  });
});

function allowLightExtensionActions(actions: string[]) {
  return ({ resource, action }: { resource: string; action: string }) => {
    if (resource === 'flowModels' && action === 'findOne') {
      return { role: 'root' };
    }
    return resource === 'lightExtension' && actions.includes(action) ? {} : null;
  };
}

function denyFlowModelRead(actions: string[]) {
  return ({ resource, action }: { resource: string; action: string }) => {
    if (resource === 'flowModels' && action === 'findOne') {
      return false;
    }
    return resource === 'lightExtension' && actions.includes(action) ? {} : null;
  };
}

function createFlowModelRecord(modelUid: string, publicationId: string, settings: Record<string, unknown>) {
  return {
    uid: modelUid,
    options: {
      uid: modelUid,
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          sourceMode: 'light-extension',
          sourceBinding: createSourceBinding({
            publicationId,
            versionPolicy: 'pinned',
          }),
          settings,
        },
      },
    },
  };
}
