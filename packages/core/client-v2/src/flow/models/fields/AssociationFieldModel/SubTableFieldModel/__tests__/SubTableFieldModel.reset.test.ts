/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EventEmitter } from 'events';
import { FlowEngine, type FlowModel } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { PopupSubTableFieldModel } from '../../PopupSubTableFieldModel/PopupSubTableFieldModel';
import { SubTableFieldModel } from '../index';

type NamePath = Array<string | number>;

function createResetContext(fieldPathArray: NamePath) {
  const engine = new FlowEngine();
  const emitter = new EventEmitter();
  const setFieldValue = vi.fn();

  engine.registerModels({ PopupSubTableFieldModel, SubTableFieldModel });
  engine.context.defineProperty('blockModel', {
    value: {
      emitter,
      setFieldValue,
    },
  });
  engine.context.defineProperty('fieldPathArray', {
    value: fieldPathArray,
  });

  return { emitter, engine, setFieldValue };
}

describe('SubTableFieldModel reset', () => {
  it('clears value through system field write instead of field onChange', () => {
    const onChange = vi.fn();
    const { emitter, engine, setFieldValue } = createResetContext(['roles']);

    engine.createModel<SubTableFieldModel>({
      uid: 'subtable-field-reset-test',
      use: 'SubTableFieldModel',
      props: { onChange },
    });

    emitter.emit('onFieldReset');

    expect(setFieldValue).toHaveBeenCalledWith(['roles'], []);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clears popup subtable value through system field write instead of field onChange', async () => {
    const onChange = vi.fn();
    const { emitter, engine, setFieldValue } = createResetContext(['users', 0, 'roles']);
    const parent = engine.createModel<FlowModel>({
      uid: 'popup-subtable-parent-reset-test',
      use: 'FlowModel',
    });
    parent.context.defineProperty('actionName', {
      value: 'create',
    });
    const model = engine.createModel<PopupSubTableFieldModel>({
      uid: 'popup-subtable-field-reset-test',
      use: 'PopupSubTableFieldModel',
      parentId: parent.uid,
      props: { onChange },
    });

    await model.onDispatchEventStart('beforeRender');
    emitter.emit('onFieldReset');

    expect(setFieldValue).toHaveBeenCalledWith(['users', 0, 'roles'], []);
    expect(onChange).not.toHaveBeenCalled();
  });
});
