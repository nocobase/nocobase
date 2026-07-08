/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createPublicationRecord,
  createReferenceRecord,
  createReferenceServiceFixture,
  stableJsonHash,
} from './reference-test-helpers';

describe('plugin-light-extension follow-active multi-host foundation', () => {
  it('keeps follow-active references out of bulk-upgrade candidates', async () => {
    const { bulkUpgradeService } = createReferenceServiceFixture({
      publications: [createPublicationRecord({ id: 'lep_v1' }), createPublicationRecord({ id: 'lep_v2' })],
      references: [
        createReferenceRecord({
          id: 'lef_follow_active',
          publicationId: 'lep_v1',
          versionPolicy: 'follow-active',
        }),
      ],
    });

    const result = await bulkUpgradeService.analyzeImpact({
      toPublicationId: 'lep_v2',
      referenceIds: ['lef_follow_active'],
    });

    expect(result.summary).toMatchObject({
      total: 1,
      upgradable: 0,
      skipped: 1,
    });
    expect(result.references[0]).toMatchObject({
      upgradeBlockedReason: 'version_policy_not_pinned',
      reference: expect.objectContaining({
        versionPolicy: 'follow-active',
      }),
    });
  });

  it('keeps placeholder host references visible to impact analysis without treating them as JS Block owners', async () => {
    const ownerLocator = {
      kind: 'flowModel.fieldSettings',
      modelUid: 'flow_field_phone',
      descriptor: 'field settings placeholder',
    };
    const { bulkUpgradeService, repositories } = createReferenceServiceFixture({
      publications: [
        createPublicationRecord({
          id: 'lep_field_v2',
          kind: 'js-field',
          entryId: 'lee_phone_link',
          entryPath: 'src/client/js-fields/phone-link/index.tsx',
        }),
      ],
      references: [
        createReferenceRecord({
          id: 'lef_js_field_placeholder',
          entryId: 'lee_phone_link',
          publicationId: 'lep_field_v1',
          kind: 'js-field',
          ownerKind: 'flowModel.fieldSettings',
          ownerLocator,
          ownerLocatorHash: stableJsonHash(ownerLocator),
        }),
      ],
    });

    const result = await bulkUpgradeService.analyzeImpact({
      toPublicationId: 'lep_field_v2',
      referenceIds: ['lef_js_field_placeholder'],
    });

    expect(result.summary).toMatchObject({
      total: 1,
      upgradable: 0,
      skipped: 1,
    });
    expect(result.references[0]).toMatchObject({
      upgradeBlockedReason: 'owner_missing',
      reference: expect.objectContaining({
        kind: 'js-field',
        ownerKind: 'flowModel.fieldSettings',
      }),
    });
    expect(repositories.flowModels.findOne).not.toHaveBeenCalled();
  });
});
