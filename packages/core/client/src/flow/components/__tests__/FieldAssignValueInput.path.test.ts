/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { resolveAssignValueFieldModelUse, resolveAssignValueFieldPath } from '../FieldAssignValueInput';
import { buildCustomFieldTargetPath } from '../../internal/utils/modelUtils';

describe('FieldAssignValueInput path resolve', () => {
  it('prefers fieldSettings.init.fieldPath when present', () => {
    const model = {
      getStepParams: (flowKey: string, stepKey: string) => {
        if (flowKey === 'fieldSettings' && stepKey === 'init') {
          return { fieldPath: 'nickname' };
        }
        if (flowKey === 'formItemSettings' && stepKey === 'fieldSettings') {
          return { name: 'custom_name' };
        }
        return undefined;
      },
    };

    expect(resolveAssignValueFieldPath(model)).toBe('nickname');
  });

  it('falls back to custom field target path token', () => {
    const model = {
      getStepParams: (flowKey: string, stepKey: string) => {
        if (flowKey === 'formItemSettings' && stepKey === 'fieldSettings') {
          return { name: 'custom_name' };
        }
        return undefined;
      },
    };

    expect(resolveAssignValueFieldPath(model)).toBe(buildCustomFieldTargetPath('custom_name'));
  });

  it('uses custom field model when form item has no bound collection field', () => {
    const model = {
      getStepParams: (flowKey: string, stepKey: string) => {
        if (flowKey === 'formItemSettings' && stepKey === 'fieldSettings') {
          return { fieldModel: 'DateTimeFilterFieldModel' };
        }
        return undefined;
      },
      customFieldModelInstance: {
        use: 'DateTimeFilterFieldModel',
      },
    };

    expect(
      resolveAssignValueFieldModelUse({
        itemModel: model,
        preferFormItemFieldModel: true,
      }),
    ).toBe('DateTimeFilterFieldModel');
  });
});
