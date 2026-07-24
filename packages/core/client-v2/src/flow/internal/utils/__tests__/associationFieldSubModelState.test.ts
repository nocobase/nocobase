/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CreateModelOptions, FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { beforeEach, describe, expect, it } from 'vitest';
import { FieldModel } from '../../../models/base/FieldModel';
import {
  getAssociationFieldModeUse,
  normalizeLegacyAssociationDisplaySubModels,
  rebuildAssociationFieldSubModel,
} from '../associationFieldSubModelState';

class DummyAssociationParentModel extends FlowModel<{ subModels: { field?: FieldModel } }> {
  getFieldSettingsInitParams() {
    return { fieldPath: 'profile' };
  }
}

class DummySubFormFieldModel extends FieldModel {}
class DummyDisplaySubItemFieldModel extends FieldModel {}
class DummyFormGridModel extends FlowModel {}
class DummyDetailsGridModel extends FlowModel {}
class DummyFormItemModel extends FlowModel {}
class DummyInputFieldModel extends FieldModel {}
class DummyOtherModel extends FlowModel {}

DummyDisplaySubItemFieldModel.define({
  createModelOptions: {
    use: 'DisplaySubItemFieldModel',
    subModels: {
      grid: {
        use: 'DetailsGridModel',
        uid: 'details-grid-default',
      },
    },
  },
});

function createFormSubModels(): NonNullable<CreateModelOptions['subModels']> {
  return {
    grid: {
      uid: 'form-grid',
      use: 'FormGridModel',
      subModels: {
        items: [
          {
            uid: 'form-item-name',
            use: 'FormItemModel',
            subModels: {
              field: {
                uid: 'input-name',
                use: 'InputFieldModel',
              },
            },
          },
        ],
      },
    },
  };
}

describe('associationFieldSubModelState', () => {
  let engine: FlowEngine;
  let parentModel: DummyAssociationParentModel;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({
      DummyAssociationParentModel,
      SubFormFieldModel: DummySubFormFieldModel,
      DisplaySubItemFieldModel: DummyDisplaySubItemFieldModel,
      FormGridModel: DummyFormGridModel,
      DetailsGridModel: DummyDetailsGridModel,
      FormItemModel: DummyFormItemModel,
      InputFieldModel: DummyInputFieldModel,
      OtherModel: DummyOtherModel,
    });
    parentModel = engine.createModel<DummyAssociationParentModel>({
      use: DummyAssociationParentModel,
      uid: 'association-parent',
      subModels: {
        field: {
          uid: 'association-field',
          use: 'SubFormFieldModel',
          stepParams: {
            eventSettings: {
              linkageRules: {
                rules: [{ key: 'keep-me' }],
              },
            },
          },
          subModels: createFormSubModels(),
        },
      },
    });
  });

  it('uses target defaults and restores the editable snapshot after a mode round trip', async () => {
    await rebuildAssociationFieldSubModel({
      parentModel,
      targetUse: 'DisplaySubItemFieldModel',
      sourceMode: 'editable',
      targetMode: 'readPretty',
    });

    expect(parentModel.subModels.field?.subModels.grid).toMatchObject({
      uid: 'details-grid-default',
      use: 'DetailsGridModel',
    });
    expect(getAssociationFieldModeUse(parentModel, 'editable')).toBe('SubFormFieldModel');

    await rebuildAssociationFieldSubModel({
      parentModel,
      targetUse: 'SubFormFieldModel',
      sourceMode: 'readPretty',
      targetMode: 'editable',
    });

    expect(parentModel.subModels.field?.subModels.grid).toMatchObject({
      uid: 'form-grid',
      use: 'FormGridModel',
    });
    expect(parentModel.subModels.field?.subModels.grid.subModels.items[0]).toMatchObject({
      uid: 'form-item-name',
      use: 'FormItemModel',
    });
    expect(parentModel.subModels.field?.getStepParams('eventSettings', 'linkageRules')).toEqual({
      rules: [{ key: 'keep-me' }],
    });
    const state = parentModel.getStepParams('editItemSettings', 'model')?.associationFieldComponentState;
    expect(Object.keys(state.byMode).sort()).toEqual(['editable', 'readPretty']);
    expect(state.byMode.editable).toEqual({ use: 'SubFormFieldModel' });
    expect(state.byMode.readPretty).toMatchObject({
      use: 'DisplaySubItemFieldModel',
      subModels: {
        grid: {
          use: 'DetailsGridModel',
        },
      },
    });
    expect(state).not.toHaveProperty('subModelsByUse');
  });

  it.each([
    ['DisplaySubItemFieldModel', 'SubFormFieldModel'],
    ['DisplaySubListFieldModel', 'SubFormListFieldModel'],
  ])('preserves legacy %s form grids as the %s editable snapshot', (displayUse, editableUse) => {
    const normalized = normalizeLegacyAssociationDisplaySubModels({
      parentModel,
      displayUse,
      subModels: {
        ...createFormSubModels(),
        other: {
          use: 'OtherModel',
          uid: 'other-model',
        },
      },
    });

    expect(normalized?.grid).toBeUndefined();
    expect(normalized?.other).toMatchObject({
      use: 'OtherModel',
      uid: 'other-model',
    });
    const state = parentModel.getStepParams('editItemSettings', 'model')?.associationFieldComponentState;
    expect(state.byMode.editable).toMatchObject({
      use: editableUse,
      subModels: {
        grid: {
          uid: 'form-grid',
          use: 'FormGridModel',
        },
      },
    });
    expect(state.byMode.readPretty).toEqual({ use: displayUse });
  });

  it('does not overwrite an existing editable snapshot during legacy normalization', () => {
    parentModel.setStepParams('editItemSettings', 'model', {
      associationFieldComponentState: {
        version: 2,
        byMode: {
          editable: {
            use: 'OtherModel',
            subModels: {
              other: {
                use: 'OtherModel',
                uid: 'existing-editable-snapshot',
              },
            },
          },
        },
      },
    });

    normalizeLegacyAssociationDisplaySubModels({
      parentModel,
      displayUse: 'DisplaySubItemFieldModel',
      subModels: createFormSubModels(),
    });

    const state = parentModel.getStepParams('editItemSettings', 'model')?.associationFieldComponentState;
    expect(state.byMode.editable).toMatchObject({
      use: 'OtherModel',
      subModels: {
        other: {
          uid: 'existing-editable-snapshot',
        },
      },
    });
  });
});
