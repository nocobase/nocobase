/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { resolveAssignValueFieldModelConfig, resolveAssignValueFieldPath } from '../FieldAssignValueInput';
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
      resolveAssignValueFieldModelConfig({
        itemModel: model,
        preferFormItemFieldModel: true,
      }).use,
    ).toBe('DateTimeFilterFieldModel');
  });

  it('forces RecordSelectFieldModel for association fields and strips inherited fieldBinding', () => {
    const model = {
      customFieldModelInstance: {
        use: 'SubFormFieldModel',
        stepParams: {
          fieldBinding: {
            use: 'SubTableFieldModel',
          },
          fieldSettings: {
            init: {
              dataSourceKey: 'legacy',
              collectionName: 'legacy_users',
              fieldPath: 'legacy_roles',
            },
          },
        },
      },
      subModels: {
        field: {
          use: 'SubFormFieldModel',
        },
      },
      getStepParams: () => undefined,
    };

    const result = resolveAssignValueFieldModelConfig({
      itemModel: model,
      defaultBindingUse: 'UploadAttachmentFieldModel',
      collectionField: {
        isAssociationField: () => true,
      } as any,
      fieldSettingsInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
        fieldPath: 'roles',
      },
    });

    expect(result.use).toBe('RecordSelectFieldModel');
    expect(result.stepParams.fieldBinding).toBeUndefined();
    expect(result.stepParams.fieldSettings).toEqual({
      init: {
        dataSourceKey: 'main',
        collectionName: 'users',
        fieldPath: 'roles',
      },
    });
  });

  it('prefers default binding for non relation fields when preferFormItemFieldModel is not enabled', () => {
    const model = {
      subModels: {
        field: {
          use: 'TextareaFieldModel',
        },
      },
      getStepParams: () => undefined,
    };

    expect(
      resolveAssignValueFieldModelConfig({
        itemModel: model,
        defaultBindingUse: 'InputFieldModel',
        collectionField: {
          isAssociationField: () => false,
        } as any,
      }).use,
    ).toBe('InputFieldModel');
  });

  it('uses fieldBinding.use as the current model for non relation FieldModel wrappers', () => {
    const model = {
      subModels: {
        field: {
          use: 'FieldModel',
          stepParams: {
            fieldBinding: {
              use: 'TextareaFieldModel',
            },
          },
        },
      },
      getStepParams: () => undefined,
    };

    expect(
      resolveAssignValueFieldModelConfig({
        itemModel: model,
        defaultBindingUse: undefined,
        collectionField: {
          isAssociationField: () => false,
        } as any,
        preferFormItemFieldModel: true,
      }).use,
    ).toBe('TextareaFieldModel');
  });
});
