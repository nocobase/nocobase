/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { FieldModel } from '../../models/base/FieldModel';
import { JSEditableFieldModel } from '../../models/fields/JSEditableFieldModel';
import { DetailsItemModel } from '../../models/blocks/details/DetailsItemModel';
import { pattern } from '../pattern';

class DummyDisplayFieldModel extends FieldModel {}

class DummyFormItemModel extends FlowModel<{ subModels: { field?: FieldModel } }> {
  collectionField: any;

  static getDefaultBindingByField() {
    return { modelName: 'FieldModel' };
  }

  getFieldSettingsInitParams() {
    return { mock: true };
  }
}

function makeCollectionField() {
  return {
    targetCollection: undefined,
    isAssociationField: () => false,
  };
}

function makeCtx(parent: DummyFormItemModel) {
  const collectionField = makeCollectionField();
  parent.collectionField = collectionField;
  return {
    model: parent,
    collectionField,
    engine: parent.flowEngine,
  } as any;
}

describe('pattern action', () => {
  it('keeps JS editable field model when switching to display only', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      DummyFormItemModel,
      FieldModel,
      JSEditableFieldModel,
      DummyDisplayFieldModel,
    });

    const parent = engine.createModel<DummyFormItemModel>({
      use: DummyFormItemModel,
      uid: 'form-item-js',
      subModels: {
        field: {
          use: FieldModel,
          uid: 'field-js',
          stepParams: {
            fieldBinding: {
              use: 'JSEditableFieldModel',
            },
            jsSettings: {
              runJs: {
                code: 'ctx.render("hello")',
              },
            },
          },
        },
      },
    });
    const field = parent.subModels.field;
    const saveSpy = vi.spyOn(engine, 'saveModel');
    const applyJsSettingsSpy = vi.spyOn(field as JSEditableFieldModel, 'scheduleApplyJsSettings');

    await pattern.afterParamsSave?.(makeCtx(parent), { pattern: 'readPretty' }, { pattern: 'editable' });

    expect(parent.subModels.field).toBe(field);
    expect(parent.subModels.field).toBeInstanceOf(JSEditableFieldModel);
    expect(parent.subModels.field?.uid).toBe('field-js');
    expect(parent.subModels.field?.getStepParams('jsSettings', 'runJs')).toMatchObject({
      code: 'ctx.render("hello")',
    });
    expect(saveSpy).not.toHaveBeenCalled();
    expect(applyJsSettingsSpy).toHaveBeenCalledTimes(1);
  });

  it('keeps JS editable field model when leaving display only', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      DummyFormItemModel,
      FieldModel,
      JSEditableFieldModel,
      DummyDisplayFieldModel,
    });

    const parent = engine.createModel<DummyFormItemModel>({
      use: DummyFormItemModel,
      uid: 'form-item-js-leave',
      subModels: {
        field: {
          use: FieldModel,
          uid: 'field-js-leave',
          stepParams: {
            fieldBinding: {
              use: 'JSEditableFieldModel',
            },
          },
        },
      },
    });
    const field = parent.subModels.field;
    const saveSpy = vi.spyOn(engine, 'saveModel');
    const applyJsSettingsSpy = vi.spyOn(field as JSEditableFieldModel, 'scheduleApplyJsSettings');

    await pattern.afterParamsSave?.(makeCtx(parent), { pattern: 'editable' }, { pattern: 'readPretty' });

    expect(parent.subModels.field).toBe(field);
    expect(parent.subModels.field).toBeInstanceOf(JSEditableFieldModel);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(applyJsSettingsSpy).toHaveBeenCalledTimes(1);
  });

  it('does not reapply JS settings when pattern is unchanged', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      DummyFormItemModel,
      FieldModel,
      JSEditableFieldModel,
    });

    const parent = engine.createModel<DummyFormItemModel>({
      use: DummyFormItemModel,
      uid: 'form-item-js-unchanged',
      subModels: {
        field: {
          use: FieldModel,
          uid: 'field-js-unchanged',
          stepParams: {
            fieldBinding: {
              use: 'JSEditableFieldModel',
            },
          },
        },
      },
    });
    const applyJsSettingsSpy = vi.spyOn(parent.subModels.field as JSEditableFieldModel, 'scheduleApplyJsSettings');

    await pattern.afterParamsSave?.(makeCtx(parent), { pattern: 'readPretty' }, { pattern: 'readPretty' });

    expect(applyJsSettingsSpy).not.toHaveBeenCalled();
  });

  it('still rebuilds regular fields when switching to display only', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      DummyFormItemModel,
      FieldModel,
      DummyDisplayFieldModel,
    });

    const parent = engine.createModel<DummyFormItemModel>({
      use: DummyFormItemModel,
      uid: 'form-item-regular',
      subModels: {
        field: {
          use: FieldModel,
          uid: 'field-regular',
        },
      },
    });
    const ctx = makeCtx(parent);
    const displayBinding = { modelName: 'DummyDisplayFieldModel', defaultProps: { display: true } } as any;
    const getDisplayBindingSpy = vi.spyOn(DetailsItemModel, 'getDefaultBindingByField').mockReturnValue(displayBinding);

    await pattern.afterParamsSave?.(ctx, { pattern: 'readPretty' }, { pattern: 'editable' });

    expect(parent.subModels.field).toBeInstanceOf(DummyDisplayFieldModel);
    expect(parent.subModels.field?.uid).toBe('field-regular');
    expect(parent.subModels.field?.props).toMatchObject({ display: true });

    getDisplayBindingSpy.mockRestore();
  });
});
