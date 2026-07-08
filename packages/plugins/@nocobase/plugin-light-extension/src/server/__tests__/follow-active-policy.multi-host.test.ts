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
      kind: 'flowModel.actionSettings',
      modelUid: 'flow_action_notify',
      descriptor: 'action settings placeholder',
    };
    const { bulkUpgradeService, repositories } = createReferenceServiceFixture({
      publications: [
        createPublicationRecord({
          id: 'lep_action_v2',
          kind: 'js-action',
          entryId: 'lee_notify',
          entryPath: 'src/client/js-actions/notify/index.ts',
        }),
      ],
      references: [
        createReferenceRecord({
          id: 'lef_js_action_placeholder',
          entryId: 'lee_notify',
          publicationId: 'lep_action_v1',
          kind: 'js-action',
          ownerKind: 'flowModel.actionSettings',
          ownerLocator,
          ownerLocatorHash: stableJsonHash(ownerLocator),
        }),
      ],
    });

    const result = await bulkUpgradeService.analyzeImpact({
      toPublicationId: 'lep_action_v2',
      referenceIds: ['lef_js_action_placeholder'],
    });

    expect(result.summary).toMatchObject({
      total: 1,
      upgradable: 0,
      skipped: 1,
    });
    expect(result.references[0]).toMatchObject({
      upgradeBlockedReason: 'owner_missing',
      reference: expect.objectContaining({
        kind: 'js-action',
        ownerKind: 'flowModel.actionSettings',
      }),
    });
    expect(repositories.flowModels.findOne).not.toHaveBeenCalled();
  });
});
