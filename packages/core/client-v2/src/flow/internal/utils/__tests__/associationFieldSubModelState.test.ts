/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionField, CreateModelOptions, FlowEngine, FlowEngineContext, FlowModel } from '@nocobase/flow-engine';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DetailsItemModel } from '../../../models/blocks/details/DetailsItemModel';
import { FieldModel } from '../../../models/base/FieldModel';
import {
  getAssociationFieldModeUse,
  migrateFormSubModelsToDetails,
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
class DummyDetailsItemModel extends FlowModel {}
class DummyInputFieldModel extends FieldModel {}
class DummyDisplayFieldModel extends FieldModel {}

function createFormSubModels(): NonNullable<CreateModelOptions['subModels']> {
  return {
    grid: {
      uid: 'grid-1',
      use: 'FormGridModel',
      props: { layout: [[['item-1']]] },
      subModels: {
        items: [
          {
            uid: 'item-1',
            use: 'FormItemModel',
            sortIndex: 2,
            props: {
              disabled: true,
              label: 'Name',
            },
            stepParams: {
              fieldSettings: {
                init: {
                  fieldPath: 'profile.name',
                },
              },
              editItemSettings: {
                showLabel: { showLabel: true },
                label: { label: 'Custom name' },
              },
            },
            subModels: {
              field: {
                uid: 'input-field-1',
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
  let ctx: FlowEngineContext & { collectionField: CollectionField };

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({
      DummyAssociationParentModel,
      SubFormFieldModel: DummySubFormFieldModel,
      DisplaySubItemFieldModel: DummyDisplaySubItemFieldModel,
      FormGridModel: DummyFormGridModel,
      DetailsGridModel: DummyDetailsGridModel,
      FormItemModel: DummyFormItemModel,
      DetailsItemModel: DummyDetailsItemModel,
      InputFieldModel: DummyInputFieldModel,
      DisplayFieldModel: DummyDisplayFieldModel,
    });
    parentModel = engine.createModel<DummyAssociationParentModel>({
      use: DummyAssociationParentModel,
      uid: 'association-parent',
      subModels: {
        field: {
          uid: 'association-field',
          use: 'SubFormFieldModel',
          subModels: createFormSubModels(),
        },
      },
    });
    const targetField = { name: 'name' } as unknown as CollectionField;
    const collectionField = {
      targetCollection: {
        getField: vi.fn(() => targetField),
      },
    } as unknown as CollectionField;
    ctx = {
      engine,
      collectionField,
    } as FlowEngineContext & { collectionField: CollectionField };
    vi.spyOn(DetailsItemModel, 'getDefaultBindingByField').mockReturnValue({
      modelName: 'DisplayFieldModel',
      defaultProps: { display: true },
    } as ReturnType<typeof DetailsItemModel.getDefaultBindingByField>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('migrates a form grid to a details grid without reusing editable item models', () => {
    const migrated = migrateFormSubModelsToDetails(createFormSubModels(), { ctx, parentModel });
    const grid = migrated?.grid as CreateModelOptions;
    const items = grid.subModels?.items as CreateModelOptions[];

    expect(grid).toMatchObject({
      uid: 'grid-1',
      use: 'DetailsGridModel',
      props: { layout: [[['item-1']]] },
    });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      uid: 'item-1',
      use: 'DetailsItemModel',
      sortIndex: 2,
      props: { label: 'Name' },
      stepParams: {
        fieldSettings: {
          init: { fieldPath: 'profile.name' },
        },
        detailItemSettings: {
          showLabel: { showLabel: true },
          label: { title: 'Custom name' },
        },
      },
      subModels: {
        field: {
          uid: 'input-field-1',
          use: 'DisplayFieldModel',
          props: { display: true },
        },
      },
    });
    expect(items[0].props).not.toHaveProperty('disabled');
  });

  it('restores the saved editable component tree after leaving display-only mode', async () => {
    await rebuildAssociationFieldSubModel({
      ctx,
      parentModel,
      targetUse: 'DisplaySubItemFieldModel',
      sourceMode: 'editable',
      targetMode: 'readPretty',
    });

    expect(parentModel.subModels.field?.subModels.grid.use).toBe('DetailsGridModel');
    expect(getAssociationFieldModeUse(parentModel, 'editable')).toBe('SubFormFieldModel');

    await rebuildAssociationFieldSubModel({
      ctx,
      parentModel,
      targetUse: 'SubFormFieldModel',
      sourceMode: 'readPretty',
      targetMode: 'editable',
    });

    const restoredGrid = parentModel.subModels.field?.subModels.grid;
    expect(parentModel.subModels.field?.use).toBe('SubFormFieldModel');
    expect(restoredGrid.use).toBe('FormGridModel');
    expect(restoredGrid.subModels.items[0]).toMatchObject({
      uid: 'item-1',
      use: 'FormItemModel',
    });
  });

  it('repairs legacy display sub-detail configurations that still contain a form grid', () => {
    const migrated = normalizeLegacyAssociationDisplaySubModels({
      ctx,
      parentModel,
      displayUse: 'DisplaySubItemFieldModel',
      subModels: createFormSubModels(),
    });

    expect((migrated?.grid as CreateModelOptions).use).toBe('DetailsGridModel');
    expect(getAssociationFieldModeUse(parentModel, 'editable')).toBe('SubFormFieldModel');
    expect(getAssociationFieldModeUse(parentModel, 'readPretty')).toBe('DisplaySubItemFieldModel');
  });
});
