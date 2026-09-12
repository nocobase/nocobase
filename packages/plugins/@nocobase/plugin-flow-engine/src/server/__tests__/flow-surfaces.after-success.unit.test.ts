/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { buildActionTree } from '../flow-surfaces/builder';
import { getNodeContract } from '../flow-surfaces/catalog';
import { getConfigureOptionsForUse } from '../flow-surfaces/configure-options';
import { normalizeAfterSuccess } from '../flow-surfaces/service-utils';

describe('flowSurfaces update action after-success contract', () => {
  it.each(['UpdateRecordActionModel', 'BulkUpdateActionModel'])('publishes and persists afterSuccess for %s', (use) => {
    expect(getConfigureOptionsForUse(use).afterSuccess).toMatchObject({
      type: 'object',
    });

    const contract = getNodeContract(use);
    const assignSettings = contract.domains.stepParams?.groups?.assignSettings;
    expect(assignSettings?.allowedPaths).toEqual(
      expect.arrayContaining([
        'afterSuccess.successMessage',
        'afterSuccess.manualClose',
        'afterSuccess.actionAfterSuccess',
        'afterSuccess.redirectTo',
      ]),
    );
    expect(assignSettings?.eventBindingSteps).toContain('afterSuccess');
    expect(assignSettings?.pathSchemas?.['afterSuccess.actionAfterSuccess']?.enum).toEqual([
      'stay',
      'previous',
      'redirect',
    ]);

    const action = buildActionTree({
      use,
      containerUse: use === 'UpdateRecordActionModel' ? 'TableActionsColumnModel' : 'TableBlockModel',
    });
    expect(action.stepParams?.assignSettings?.afterSuccess).toEqual({
      successMessage: '{{t("Saved successfully")}}',
      manualClose: false,
      actionAfterSuccess: 'stay',
    });
  });

  it('normalizes supported after-success values and rejects an invalid action', () => {
    expect(
      normalizeAfterSuccess({
        successMessage: 'Updated',
        manualClose: true,
        actionAfterSuccess: 'redirect',
        redirectTo: '/admin/updated',
      }),
    ).toEqual({
      successMessage: 'Updated',
      manualClose: true,
      actionAfterSuccess: 'redirect',
      redirectTo: '/admin/updated',
    });

    expect(() => normalizeAfterSuccess({ actionAfterSuccess: 'close' })).toThrow(
      'afterSuccess.actionAfterSuccess must be stay, previous, or redirect',
    );
  });
});
