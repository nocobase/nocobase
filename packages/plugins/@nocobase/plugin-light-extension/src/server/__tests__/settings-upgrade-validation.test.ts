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

describe('plugin-light-extension settings upgrade validation', () => {
  it('uses the target publication settings snapshot and reports field-level incompatibilities', async () => {
    const { bulkUpgradeService, recordReferenceEvent } = createReferenceServiceFixture({
      flowModels: [createFlowModelRecord('flow_incompatible', 'lep_v1', { threshold: 99, extraPayload: 'hidden' })],
      publications: [
        createPublicationRecord({
          id: 'lep_v1',
          settingsSchemaSnapshot: null,
          settingsDefaultsSnapshot: {},
        }),
        createPublicationRecord({
          id: 'lep_v2',
          settingsSchemaSnapshot: {
            type: 'object',
            properties: {
              threshold: {
                type: 'number',
                maximum: 10,
              },
            },
          },
          settingsDefaultsSnapshot: {
            threshold: 5,
          },
        }),
      ],
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
      references: [
        createReferenceRecord({
          id: 'lef_incompatible',
          modelUid: 'flow_incompatible',
          publicationId: 'lep_v1',
          settingsHash: stableJsonHash({ threshold: 99, extraPayload: 'hidden' }),
        }),
      ],
    });

    const impact = await bulkUpgradeService.analyzeImpact(
      {
        toPublicationId: 'lep_v2',
        referenceIds: ['lef_incompatible'],
      },
      {
        can: allowLightExtensionActions(['readReferences', 'usePublication']),
      },
    );

    expect(impact.references[0]).toMatchObject({
      settingsValidation: {
        compatible: false,
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: '$.threshold',
            code: 'settings_maximum',
          }),
          expect.objectContaining({
            path: '$.extraPayload',
            code: 'settings_unknown_property',
          }),
        ]),
      },
    });

    const result = await bulkUpgradeService.bulkUpgrade(
      {
        toPublicationId: 'lep_v2',
        referenceIds: ['lef_incompatible'],
        expectedPublicationIdByReference: {
          lef_incompatible: 'lep_v1',
        },
        expectedSettingsHashByReference: {
          lef_incompatible: stableJsonHash({ threshold: 99, extraPayload: 'hidden' }),
        },
      },
      {
        requestId: 'req_settings_incompatible',
        can: allowLightExtensionActions(['updateReferences', 'usePublication']),
      },
    );

    expect(result.items[0]).toMatchObject({
      referenceId: 'lef_incompatible',
      status: 'incompatible',
      reasonCode: 'settings_invalid',
      issues: expect.arrayContaining([
        expect.objectContaining({
          path: '$.threshold',
        }),
      ]),
    });
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'referenceBulkUpgrade',
        result: 'blocked',
        reasonCode: 'settings_invalid',
        details: expect.objectContaining({
          issuePaths: expect.arrayContaining(['$.threshold', '$.extraPayload']),
        }),
      }),
    );
    expect(JSON.stringify(recordReferenceEvent.mock.calls)).not.toContain('hidden');
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
