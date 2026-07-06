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

describe('plugin-light-extension bulk upgrade references', () => {
  it('upgrades only selected pinned references and updates the owner FlowModel binding', async () => {
    const selectedReference = createReferenceRecord({
      id: 'lef_selected',
      modelUid: 'flow_selected',
      publicationId: 'lep_v1',
      settingsHash: stableJsonHash({ threshold: 6, region: 'APAC' }),
    });
    const untouchedReference = createReferenceRecord({
      id: 'lef_untouched',
      modelUid: 'flow_untouched',
      publicationId: 'lep_v1',
      settingsHash: stableJsonHash({ threshold: 7, region: 'APAC' }),
    });
    const { bulkUpgradeService, repositories, recordReferenceEvent } = createReferenceServiceFixture({
      flowModels: [
        createFlowModelRecord('flow_selected', 'lep_v1', { threshold: 6 }),
        createFlowModelRecord('flow_untouched', 'lep_v1', { threshold: 7 }),
      ],
      publications: [
        createPublicationRecord({ id: 'lep_v1', settingsDefaultsSnapshot: { threshold: 5, region: 'APAC' } }),
        createPublicationRecord({ id: 'lep_v2', settingsDefaultsSnapshot: { threshold: 8, region: 'APAC' } }),
      ],
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
      references: [selectedReference, untouchedReference],
    });

    const result = await bulkUpgradeService.bulkUpgrade(
      {
        toPublicationId: 'lep_v2',
        referenceIds: ['lef_selected'],
        expectedPublicationIdByReference: {
          lef_selected: 'lep_v1',
        },
        expectedSettingsHashByReference: {
          lef_selected: stableJsonHash({ threshold: 6, region: 'APAC' }),
        },
      },
      {
        requestId: 'req_bulk_upgrade',
        can: allowLightExtensionActions(['updateReferences', 'usePublication']),
      },
    );

    expect(result.summary).toMatchObject({
      upgraded: 1,
      conflict: 0,
      incompatible: 0,
    });
    expect(repositories.lightExtensionReferences.records.map((record) => record.toJSON())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'lef_selected',
          publicationId: 'lep_v2',
          settingsHash: stableJsonHash({ threshold: 6, region: 'APAC' }),
          versionPolicy: 'pinned',
        }),
        expect.objectContaining({
          id: 'lef_untouched',
          publicationId: 'lep_v1',
        }),
      ]),
    );
    expect(repositories.flowModels.records[0].toJSON()).toMatchObject({
      options: {
        stepParams: {
          jsSettings: {
            sourceBinding: expect.objectContaining({
              publicationId: 'lep_v2',
              versionPolicy: 'pinned',
            }),
          },
        },
      },
    });
    expect(repositories.flowModels.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByTk: 'flow_selected',
        lock: true,
      }),
    );
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'referenceBulkUpgrade',
        result: 'success',
        publicationId: 'lep_v2',
      }),
    );
  });

  it('blocks concurrent publication or settings changes instead of overwriting them', async () => {
    const { bulkUpgradeService, recordReferenceEvent } = createReferenceServiceFixture({
      flowModels: [createFlowModelRecord('flow_selected', 'lep_v1', { threshold: 6 })],
      publications: [createPublicationRecord({ id: 'lep_v2' })],
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
      references: [
        createReferenceRecord({
          id: 'lef_selected',
          modelUid: 'flow_selected',
          publicationId: 'lep_v1',
          settingsHash: stableJsonHash({ threshold: 6, region: 'APAC' }),
        }),
      ],
    });

    const result = await bulkUpgradeService.bulkUpgrade(
      {
        toPublicationId: 'lep_v2',
        referenceIds: ['lef_selected'],
        expectedPublicationIdByReference: {
          lef_selected: 'lep_old',
        },
        expectedSettingsHashByReference: {
          lef_selected: stableJsonHash({ threshold: 6, region: 'APAC' }),
        },
      },
      {
        requestId: 'req_bulk_conflict',
        can: allowLightExtensionActions(['updateReferences', 'usePublication']),
      },
    );

    expect(result.items[0]).toMatchObject({
      referenceId: 'lef_selected',
      status: 'conflict',
      reasonCode: 'publication_changed',
    });
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'referenceBulkUpgrade',
        result: 'blocked',
        reasonCode: 'publication_changed',
      }),
    );
    expect(JSON.stringify(recordReferenceEvent.mock.calls)).not.toContain('threshold');
  });

  it('blocks upgrades when the live owner settings drift from the indexed settings hash', async () => {
    const { bulkUpgradeService, repositories, recordReferenceEvent } = createReferenceServiceFixture({
      flowModels: [createFlowModelRecord('flow_selected', 'lep_v1', { threshold: 9 })],
      publications: [
        createPublicationRecord({ id: 'lep_v1', settingsDefaultsSnapshot: { threshold: 5, region: 'APAC' } }),
        createPublicationRecord({ id: 'lep_v2', settingsDefaultsSnapshot: { threshold: 8, region: 'APAC' } }),
      ],
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
      references: [
        createReferenceRecord({
          id: 'lef_selected',
          modelUid: 'flow_selected',
          publicationId: 'lep_v1',
          settingsHash: stableJsonHash({ threshold: 6, region: 'APAC' }),
        }),
      ],
    });

    const result = await bulkUpgradeService.bulkUpgrade(
      {
        toPublicationId: 'lep_v2',
        referenceIds: ['lef_selected'],
        expectedPublicationIdByReference: {
          lef_selected: 'lep_v1',
        },
        expectedSettingsHashByReference: {
          lef_selected: stableJsonHash({ threshold: 6, region: 'APAC' }),
        },
      },
      {
        requestId: 'req_live_settings_conflict',
        can: allowLightExtensionActions(['updateReferences', 'usePublication']),
      },
    );

    expect(result.items[0]).toMatchObject({
      referenceId: 'lef_selected',
      status: 'conflict',
      reasonCode: 'settings_changed',
    });
    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      publicationId: 'lep_v1',
      settingsHash: stableJsonHash({ threshold: 6, region: 'APAC' }),
    });
    expect(repositories.flowModels.records[0].toJSON()).toMatchObject({
      options: {
        stepParams: {
          jsSettings: {
            sourceBinding: expect.objectContaining({
              publicationId: 'lep_v1',
            }),
          },
        },
      },
    });
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'referenceBulkUpgrade',
        result: 'blocked',
        reasonCode: 'settings_changed',
      }),
    );
  });

  it('rolls back the reference row when owner binding update fails', async () => {
    const { bulkUpgradeService, repositories } = createReferenceServiceFixture({
      flowModels: [createFlowModelRecord('flow_selected', 'lep_v1', { threshold: 6 })],
      publications: [
        createPublicationRecord({ id: 'lep_v1', settingsDefaultsSnapshot: { threshold: 5, region: 'APAC' } }),
        createPublicationRecord({ id: 'lep_v2', settingsDefaultsSnapshot: { threshold: 8, region: 'APAC' } }),
      ],
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
      references: [
        createReferenceRecord({
          id: 'lef_selected',
          modelUid: 'flow_selected',
          publicationId: 'lep_v1',
          settingsHash: stableJsonHash({ threshold: 6, region: 'APAC' }),
        }),
      ],
    });
    repositories.flowModels.records[0].update.mockRejectedValueOnce(new Error('owner update failed'));

    await expect(
      bulkUpgradeService.bulkUpgrade(
        {
          toPublicationId: 'lep_v2',
          referenceIds: ['lef_selected'],
          expectedPublicationIdByReference: {
            lef_selected: 'lep_v1',
          },
          expectedSettingsHashByReference: {
            lef_selected: stableJsonHash({ threshold: 6, region: 'APAC' }),
          },
        },
        {
          requestId: 'req_owner_update_failed',
          can: allowLightExtensionActions(['updateReferences', 'usePublication']),
        },
      ),
    ).rejects.toThrow('owner update failed');

    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      publicationId: 'lep_v1',
      settingsHash: stableJsonHash({ threshold: 6, region: 'APAC' }),
    });
    expect(repositories.flowModels.records[0].toJSON()).toMatchObject({
      options: {
        stepParams: {
          jsSettings: {
            sourceBinding: expect.objectContaining({
              publicationId: 'lep_v1',
            }),
          },
        },
      },
    });
  });
});

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

function allowLightExtensionActions(actions: string[]) {
  return ({ resource, action }: { resource: string; action: string }) => {
    if (resource === 'flowModels' && action === 'findOne') {
      return { role: 'root' };
    }
    return resource === 'lightExtension' && actions.includes(action) ? {} : null;
  };
}
