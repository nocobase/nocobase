/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionField, FlowEngine, FlowEngineContext, FlowModel } from '@nocobase/flow-engine';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DetailsItemModel } from '../../models/blocks/details/DetailsItemModel';
import { FieldModel } from '../../models/base/FieldModel';
import { fieldComponent } from '../fieldComponent';
import { pattern } from '../pattern';

class DummyAssociationFormItemModel extends FlowModel<{ subModels: { field?: FieldModel } }> {
  static getBindingsByField() {
    return [{ modelName: 'SubFormFieldModel', defaultProps: { editable: true } }];
  }

  static getDefaultBindingByField() {
    return { modelName: 'DefaultEditableFieldModel', defaultProps: { editable: 'default' } };
  }

  getFieldSettingsInitParams() {
    return { fieldPath: 'profile' };
  }
}

class DummySubFormFieldModel extends FieldModel {}
class DummyDisplaySubItemFieldModel extends FieldModel {}
class DummyDisplayTitleFieldModel extends FieldModel {}
class DummyDefaultEditableFieldModel extends FieldModel {}
class DummyFormGridModel extends FlowModel {}
class DummyDetailsGridModel extends FlowModel {}
class DummyFormItemModel extends FlowModel {}
class DummyDetailsItemModel extends FlowModel {}
class DummyInputFieldModel extends FieldModel {}

describe('association field component state actions', () => {
  let engine: FlowEngine;
  let parentModel: DummyAssociationFormItemModel;
  let ctx: FlowEngineContext & {
    model: DummyAssociationFormItemModel;
    collectionField: CollectionField;
  };

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({
      DummyAssociationFormItemModel,
      SubFormFieldModel: DummySubFormFieldModel,
      DisplaySubItemFieldModel: DummyDisplaySubItemFieldModel,
      DisplayTitleFieldModel: DummyDisplayTitleFieldModel,
      DefaultEditableFieldModel: DummyDefaultEditableFieldModel,
      FormGridModel: DummyFormGridModel,
      DetailsGridModel: DummyDetailsGridModel,
      FormItemModel: DummyFormItemModel,
      DetailsItemModel: DummyDetailsItemModel,
      InputFieldModel: DummyInputFieldModel,
    });
    parentModel = engine.createModel<DummyAssociationFormItemModel>({
      use: DummyAssociationFormItemModel,
      uid: 'association-form-item',
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
          subModels: {
            grid: {
              uid: 'form-grid',
              use: 'FormGridModel',
              subModels: {
                items: [
                  {
                    uid: 'form-item-name',
                    use: 'FormItemModel',
                    stepParams: {
                      fieldSettings: {
                        init: { fieldPath: 'profile.name' },
                      },
                    },
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
          },
        },
      },
    });

    const titleField = { name: 'name' } as unknown as CollectionField;
    const collectionField = {
      targetCollectionTitleFieldName: 'name',
      targetCollection: {
        getField: vi.fn(() => titleField),
      },
      isAssociationField: () => true,
    } as unknown as CollectionField;
    ctx = {
      engine,
      model: parentModel,
      collectionField,
    } as FlowEngineContext & {
      model: DummyAssociationFormItemModel;
      collectionField: CollectionField;
    };

    vi.spyOn(DetailsItemModel, 'getBindingsByField').mockImplementation((_ctx, field) => {
      if (field === collectionField) {
        return [{ modelName: 'DisplaySubItemFieldModel', defaultProps: { detail: true } }];
      }
      return [{ modelName: 'DisplayTitleFieldModel', defaultProps: { title: true } }];
    });
    vi.spyOn(DetailsItemModel, 'getDefaultBindingByField').mockReturnValue({
      modelName: 'DisplayTitleFieldModel',
      defaultProps: { title: true },
    } as ReturnType<typeof DetailsItemModel.getDefaultBindingByField>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('migrates Subform to Sub-detail and restores Subform after returning to editable mode', async () => {
    await pattern.beforeParamsSave?.(ctx, { pattern: 'readPretty' }, { pattern: 'editable' });
    await pattern.afterParamsSave?.(ctx, { pattern: 'readPretty' }, { pattern: 'editable' });

    expect(parentModel.subModels.field?.use).toBe('DisplayTitleFieldModel');

    await fieldComponent.beforeParamsSave?.(
      ctx,
      { use: 'DisplaySubItemFieldModel' },
      { use: 'DisplayTitleFieldModel' },
    );

    const detailsGrid = parentModel.subModels.field?.subModels.grid;
    expect(parentModel.subModels.field?.use).toBe('DisplaySubItemFieldModel');
    expect(detailsGrid.use).toBe('DetailsGridModel');
    expect(detailsGrid.subModels.items[0]).toMatchObject({
      uid: 'form-item-name',
      use: 'DetailsItemModel',
    });

    await pattern.beforeParamsSave?.(ctx, { pattern: 'editable' }, { pattern: 'readPretty' });
    await pattern.afterParamsSave?.(ctx, { pattern: 'editable' }, { pattern: 'readPretty' });

    const restoredGrid = parentModel.subModels.field?.subModels.grid;
    expect(parentModel.subModels.field?.use).toBe('SubFormFieldModel');
    expect(restoredGrid.use).toBe('FormGridModel');
    expect(restoredGrid.subModels.items[0]).toMatchObject({
      uid: 'form-item-name',
      use: 'FormItemModel',
    });
    expect(parentModel.subModels.field?.getStepParams('eventSettings', 'linkageRules')).toEqual({
      rules: [{ key: 'keep-me' }],
    });
  });
});
