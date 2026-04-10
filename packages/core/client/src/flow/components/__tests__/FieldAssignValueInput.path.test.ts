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
  buildAssignValueFieldStepParams,
  resolveAssignValueEditorFieldContext,
  resolveAssignValueFieldModelUse,
  resolveAssignValueFieldPath,
  resolveAssignValueNestedAssociationField,
} from '../FieldAssignValueInput';
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

  it('prefers collection default editable binding by default', () => {
    const model = {
      subModels: {
        field: {
          use: 'PopupSubTableFieldModel',
        },
      },
    };

    expect(
      resolveAssignValueFieldModelUse({
        itemModel: model,
        fieldModelUse: 'RecordSelectFieldModel',
      }),
    ).toBe('RecordSelectFieldModel');
  });

  it('maps file relation upload binding to record select in assign context', () => {
    expect(
      resolveAssignValueFieldModelUse({
        itemModel: null,
        fieldModelUse: 'UploadFieldModel',
        collectionField: {
          isAssociationField: () => true,
          targetCollection: {
            template: 'file',
          },
        } as any,
      }),
    ).toBe('RecordSelectFieldModel');
  });

  it('does not fall back to current form item field model in assign context when binding is missing', () => {
    const model = {
      subModels: {
        field: {
          use: 'PopupSubTableFieldModel',
        },
      },
    };

    expect(
      resolveAssignValueFieldModelUse({
        itemModel: model,
        fieldModelUse: undefined,
        collectionField: {
          isAssociationField: () => true,
          targetCollection: {
            template: 'general',
          },
        } as any,
      }),
    ).toBe('RecordSelectFieldModel');
  });

  it('does not fall back to custom association field model in assign context when binding is missing', () => {
    const model = {
      getStepParams: (flowKey: string, stepKey: string) => {
        if (flowKey === 'formItemSettings' && stepKey === 'fieldSettings') {
          return { fieldModel: 'PopupSubTableFieldModel' };
        }
        return undefined;
      },
      customFieldModelInstance: {
        use: 'PopupSubTableFieldModel',
      },
    };

    expect(
      resolveAssignValueFieldModelUse({
        itemModel: model,
        fieldModelUse: undefined,
        collectionField: {
          isAssociationField: () => true,
          targetCollection: {
            template: 'general',
          },
        } as any,
      }),
    ).toBe('RecordSelectFieldModel');
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

  it('uses custom field model for custom field when collection field is absent', () => {
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
        preferFormItemFieldModel: false,
      }),
    ).toBe('DateTimeFilterFieldModel');
  });

  it('reuses current form item field model only when explicitly requested', () => {
    const model = {
      subModels: {
        field: {
          use: 'PopupSubTableFieldModel',
        },
      },
    };

    expect(
      resolveAssignValueFieldModelUse({
        itemModel: model,
        fieldModelUse: 'RecordSelectFieldModel',
        preferFormItemFieldModel: true,
      }),
    ).toBe('PopupSubTableFieldModel');
  });

  it('overrides inherited fieldBinding.use with the resolved assign field model use', () => {
    expect(
      buildAssignValueFieldStepParams({
        originStepParams: {
          fieldBinding: {
            use: 'PopupSubTableFieldModel',
          },
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'users',
              fieldPath: 'roles',
            },
          },
        },
        effectiveFieldModelUse: 'RecordSelectFieldModel',
        dataSourceKey: 'main',
        collectionName: 'users',
        fieldPath: 'roles',
      }),
    ).toEqual({
      fieldBinding: {
        use: 'RecordSelectFieldModel',
      },
      fieldSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'users',
          fieldPath: 'roles',
        },
      },
    });
  });

  it('preserves custom field step params while filling resolved field binding use', () => {
    expect(
      buildAssignValueFieldStepParams({
        originStepParams: {
          selectSettings: {
            fieldNames: {
              label: 'title',
              value: 'id',
            },
          },
        },
        effectiveFieldModelUse: 'RecordSelectFieldModel',
      }),
    ).toEqual({
      fieldBinding: {
        use: 'RecordSelectFieldModel',
      },
      selectSettings: {
        fieldNames: {
          label: 'title',
          value: 'id',
        },
      },
    });
  });

  it('resolves nested association target key path metadata', () => {
    const roleIdField = {
      name: 'id',
      interface: 'integer',
      type: 'integer',
      isAssociationField: () => false,
    };
    const rolesCollection = {
      name: 'roles',
      filterTargetKey: 'id',
      getField: (name: string) => (name === 'id' ? roleIdField : undefined),
    };
    const rolesField = {
      name: 'roles',
      interface: 'm2m',
      type: 'belongsToMany',
      targetCollection: rolesCollection,
      targetKey: 'id',
      isAssociationField: () => true,
    };
    const usersCollection = {
      name: 'users',
      getField: (name: string) => (name === 'roles' ? rolesField : undefined),
    };

    expect(resolveAssignValueNestedAssociationField(usersCollection, 'roles.id')).toEqual({
      collection: rolesCollection,
      fieldName: 'id',
      collectionField: roleIdField,
      associationPath: 'roles',
      associationField: rolesField,
      associationCollection: usersCollection,
      isAssociationKeyPath: true,
    });
  });

  it('keeps nested leaf field context when the resolved editor model is not an association editor', () => {
    const roleIdField = {
      name: 'id',
      interface: 'integer',
      type: 'integer',
      isAssociationField: () => false,
    };
    const rolesCollection = {
      name: 'roles',
      getField: (name: string) => (name === 'id' ? roleIdField : undefined),
    };
    const rolesField = {
      name: 'roles',
      interface: 'm2m',
      type: 'belongsToMany',
      targetCollection: rolesCollection,
      targetKey: 'id',
      isAssociationField: () => true,
    };
    const usersCollection = {
      name: 'users',
    };

    const nestedAssociation = {
      collection: rolesCollection,
      fieldName: 'id',
      collectionField: roleIdField,
      associationPath: 'roles',
      associationField: rolesField,
      associationCollection: usersCollection,
      isAssociationKeyPath: true,
    };

    expect(
      resolveAssignValueEditorFieldContext({
        collection: rolesCollection,
        fieldPath: 'id',
        fieldName: 'id',
        collectionField: roleIdField as any,
        nestedAssociation: nestedAssociation as any,
        effectiveFieldModelUse: 'InputFieldModel',
      }),
    ).toEqual({
      collection: rolesCollection,
      fieldPath: 'id',
      fieldName: 'id',
      collectionField: roleIdField,
    });
  });

  it('switches to association field context when association editor resolves on target key path', () => {
    const roleIdField = {
      name: 'id',
      interface: 'integer',
      type: 'integer',
      isAssociationField: () => false,
    };
    const rolesCollection = {
      name: 'roles',
      getField: (name: string) => (name === 'id' ? roleIdField : undefined),
    };
    const rolesField = {
      name: 'roles',
      interface: 'm2m',
      type: 'belongsToMany',
      targetCollection: rolesCollection,
      targetKey: 'id',
      isAssociationField: () => true,
    };
    const usersCollection = {
      name: 'users',
    };

    expect(
      resolveAssignValueEditorFieldContext({
        collection: rolesCollection,
        fieldPath: 'id',
        fieldName: 'id',
        collectionField: roleIdField as any,
        nestedAssociation: {
          collection: rolesCollection,
          fieldName: 'id',
          collectionField: roleIdField as any,
          associationPath: 'roles',
          associationField: rolesField as any,
          associationCollection: usersCollection,
          isAssociationKeyPath: true,
        },
        effectiveFieldModelUse: 'RecordSelectFieldModel',
      }),
    ).toEqual({
      collection: usersCollection,
      fieldPath: 'roles',
      fieldName: 'roles',
      collectionField: rolesField,
    });
  });
});
