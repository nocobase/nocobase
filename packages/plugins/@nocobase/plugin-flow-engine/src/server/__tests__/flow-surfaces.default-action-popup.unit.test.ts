/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { buildFlowSurfaceDefaultActionPopupBlocks } from '../flow-surfaces/default-action-popup';

function readSubmitActionSettings(actionUse: 'AddNewActionModel' | 'EditActionModel') {
  const [block] = buildFlowSurfaceDefaultActionPopupBlocks(actionUse, ['name']);
  return block?.actions?.[0]?.settings;
}

describe('flowSurfaces default action popup', () => {
  it('should use a primary Submit button for add-new and edit popup forms', () => {
    expect(readSubmitActionSettings('AddNewActionModel')).toMatchObject({
      title: 'Submit',
      type: 'primary',
    });
    expect(readSubmitActionSettings('EditActionModel')).toMatchObject({
      title: 'Submit',
      type: 'primary',
    });
  });
});
