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

  it('drops wrapper association models, prefers editable default binding, and strips inherited fieldBinding', () => {
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
      defaultBindingUse: 'CascadeSelectListFieldModel',
      collectionField: {
        isAssociationField: () => true,
      } as any,
      fieldSettingsInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
        fieldPath: 'roles',
      },
    });

    expect(result.use).toBe('CascadeSelectListFieldModel');
    expect(result.stepParams.fieldBinding).toBeUndefined();
    expect(result.stepParams.fieldSettings).toEqual({
      init: {
        dataSourceKey: 'main',
        collectionName: 'users',
        fieldPath: 'roles',
      },
    });
  });

  it('uses fieldBinding.use as the current association model and drops wrapper fieldBinding values', () => {
    const model = {
      subModels: {
        field: {
          use: 'FieldModel',
          stepParams: {
            fieldBinding: {
              use: 'RecordPickerFieldModel',
            },
          },
        },
      },
      getStepParams: () => undefined,
    };

    expect(
      resolveAssignValueFieldModelConfig({
        itemModel: model,
        defaultBindingUse: 'RecordSelectFieldModel',
        collectionField: {
          isAssociationField: () => true,
        } as any,
      }).use,
    ).toBe('RecordSelectFieldModel');
  });

  it('treats FieldModel as an association wrapper and falls back to default binding', () => {
    const model = {
      subModels: {
        field: {
          use: 'FieldModel',
        },
      },
      getStepParams: () => undefined,
    };

    expect(
      resolveAssignValueFieldModelConfig({
        itemModel: model,
        defaultBindingUse: 'CascadeSelectListFieldModel',
        collectionField: {
          isAssociationField: () => true,
        } as any,
        preferFormItemFieldModel: true,
      }).use,
    ).toBe('CascadeSelectListFieldModel');
  });

  it('keeps FilterFormRecordSelectFieldModel when preferFormItemFieldModel is enabled', () => {
    const model = {
      subModels: {
        field: {
          use: 'FilterFormRecordSelectFieldModel',
        },
      },
      getStepParams: () => undefined,
    };

    expect(
      resolveAssignValueFieldModelConfig({
        itemModel: model,
        defaultBindingUse: 'CascadeSelectListFieldModel',
        collectionField: {
          isAssociationField: () => true,
        } as any,
        preferFormItemFieldModel: true,
      }).use,
    ).toBe('FilterFormRecordSelectFieldModel');
  });

  it('keeps FilterFormCustomRecordSelectFieldModel when preferFormItemFieldModel is enabled', () => {
    const model = {
      getStepParams: (flowKey: string, stepKey: string) => {
        if (flowKey === 'formItemSettings' && stepKey === 'fieldSettings') {
          return { fieldModel: 'FilterFormCustomRecordSelectFieldModel' };
        }
        return undefined;
      },
      customFieldModelInstance: {
        use: 'FilterFormCustomRecordSelectFieldModel',
      },
    };

    expect(
      resolveAssignValueFieldModelConfig({
        itemModel: model,
        defaultBindingUse: 'RecordSelectFieldModel',
        collectionField: {
          isAssociationField: () => true,
        } as any,
        preferFormItemFieldModel: true,
      }).use,
    ).toBe('FilterFormCustomRecordSelectFieldModel');
  });

  it('prefers editable default binding for association fields when preferFormItemFieldModel is not enabled', () => {
    const model = {
      subModels: {
        field: {
          use: 'FilterFormRecordSelectFieldModel',
        },
      },
      getStepParams: () => undefined,
    };

    expect(
      resolveAssignValueFieldModelConfig({
        itemModel: model,
        defaultBindingUse: 'CascadeSelectListFieldModel',
        collectionField: {
          isAssociationField: () => true,
        } as any,
      }).use,
    ).toBe('CascadeSelectListFieldModel');
  });

  it('falls back to RecordSelectFieldModel when association current/default candidates are unavailable or wrappers', () => {
    const model = {
      subModels: {
        field: {
          use: 'PopupSubTableFieldModel',
        },
      },
      getStepParams: () => undefined,
    };

    expect(
      resolveAssignValueFieldModelConfig({
        itemModel: model,
        defaultBindingUse: 'SubTableFieldModel',
        collectionField: {
          isAssociationField: () => true,
        } as any,
      }).use,
    ).toBe('RecordSelectFieldModel');
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
