/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test, vi, beforeEach } from 'vitest';
import { FlowEngine } from '@nocobase/flow-engine';
import { FlowModel } from '@nocobase/flow-engine';
import { FieldModel } from '../../../models/base/FieldModel';
import { rebuildFieldSubModel, getFieldBindingUse } from '../rebuildFieldSubModel';

class DummyTargetFieldModel extends FieldModel {}
class DummyColumnModel extends FlowModel {}

class DummyParentModel extends FlowModel<{ subModels: { field?: FieldModel } }> {
  getFieldSettingsInitParams() {
    return { mock: true };
  }
}

describe('rebuildFieldSubModel', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({
      FieldModel,
      DummyTargetFieldModel,
      DummyColumnModel,
      DummyParentModel,
    });
  });

  test('rebuilds field with same uid and updates binding use', async () => {
    const staleClickHandler = () => null;
    const parent = engine.createModel<DummyParentModel>({
      use: DummyParentModel,
      uid: 'parent-1',
      subModels: {
        field: {
          use: FieldModel,
          uid: 'field-1',
          props: { foo: 'bar', onClick: staleClickHandler },
          stepParams: {
            fieldBinding: { use: 'FieldModel' },
            fieldSettings: { init: { initKey: true } },
          },
        },
      },
    });

    const dispatchSpy = vi.spyOn(FieldModel.prototype, 'dispatchEvent');

    await rebuildFieldSubModel({
      parentModel: parent,
      targetUse: 'DummyTargetFieldModel',
      defaultProps: { added: 'yes' },
      pattern: 'readPretty',
    });

    const rebuilt = parent.subModels.field as DummyTargetFieldModel;

    expect(rebuilt).toBeInstanceOf(DummyTargetFieldModel);
    expect(rebuilt.uid).toBe('field-1');
    expect(getFieldBindingUse(rebuilt)).toBe('DummyTargetFieldModel');
    expect(rebuilt.props).toMatchObject({ foo: 'bar', added: 'yes', pattern: 'readPretty' });
    expect((rebuilt.props as any).onClick).toBeUndefined();

    expect(dispatchSpy).toHaveBeenCalledWith('beforeRender', undefined, { useCache: false });
    dispatchSpy.mockRestore();
  });

  test('preserves previous field subModels during rebuild', async () => {
    const parent = engine.createModel<DummyParentModel>({
      use: DummyParentModel,
      uid: 'parent-2',
      subModels: {
        field: {
          use: FieldModel,
          uid: 'field-2',
          stepParams: {
            fieldBinding: { use: 'FieldModel' },
            fieldSettings: { init: { initKey: true } },
          },
          subModels: {
            columns: [
              { use: DummyColumnModel, uid: 'col-1', sortIndex: 0 },
              { use: DummyColumnModel, uid: 'col-2', sortIndex: 1 },
            ],
          },
        },
      },
    });

    await rebuildFieldSubModel({
      parentModel: parent,
      targetUse: 'DummyTargetFieldModel',
    });

    const rebuilt = parent.subModels.field as DummyTargetFieldModel;
    const cols = rebuilt.subModels?.['columns'] as any[];
    expect(Array.isArray(cols)).toBe(true);
    expect(cols.map((c) => c.uid)).toEqual(['col-1', 'col-2']);
  });
});
