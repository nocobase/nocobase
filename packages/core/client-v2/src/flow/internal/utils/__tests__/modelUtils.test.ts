/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  buildCustomFieldTargetPath,
  findFormItemModelByFieldPath,
  getFormItemFieldPathCandidates,
} from '../modelUtils';

describe('modelUtils', () => {
  it('builds custom field target path candidates from formItemSettings', () => {
    const model = {
      getStepParams: (flowKey: string, stepKey: string) => {
        if (flowKey === 'formItemSettings' && stepKey === 'fieldSettings') {
          return { name: 'custom_age' };
        }
        return undefined;
      },
    };

    expect(getFormItemFieldPathCandidates(model)).toEqual([buildCustomFieldTargetPath('custom_age')]);
  });

  it('finds custom form item by custom target path token', () => {
    const normalItem = {
      uid: 'normal-1',
      fieldPath: 'age',
      getStepParams: (flowKey: string, stepKey: string) => {
        if (flowKey === 'fieldSettings' && stepKey === 'init') {
          return { fieldPath: 'age' };
        }
        return undefined;
      },
      subModels: { field: {} },
    };
    const customItem = {
      uid: 'custom-1',
      getStepParams: (flowKey: string, stepKey: string) => {
        if (flowKey === 'formItemSettings' && stepKey === 'fieldSettings') {
          return { name: 'custom_age' };
        }
        return undefined;
      },
      subModels: { field: {} },
    };
    const root = {
      subModels: {
        grid: {
          subModels: {
            items: [normalItem, customItem],
          },
        },
      },
    };

    const targetPath = buildCustomFieldTargetPath('custom_age');
    expect(findFormItemModelByFieldPath(root, targetPath)).toBe(customItem as any);
  });
});
