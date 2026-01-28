/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { Application } from '../../../../../../application/Application';
import { defaultOperator } from '../defaultOperator';

function createModel() {
  const engine = new FlowEngine();
  const model = new FlowModel({ uid: 'm-default-operator', flowEngine: engine });
  const app = new Application({});
  model.context.defineProperty('app', { value: app });
  return model;
}

describe('defaultOperator action', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('filters operator options using visible(meta)', async () => {
    const model = createModel();

    // provide a fake filterField and collectionField meta
    model.context.defineProperty('filterField', {
      value: { name: 'f', title: 'F', type: 'string', uiSchema: {} },
    });

    // register a field interface with operators where some have visible
    const opA = { value: '$a', label: 'A' };
    const opB = { value: '$b', label: 'B', visible: (meta: any) => meta.type === 'boolean' };

    // collectionField with operators - current meta type is string -> only opA should be present
    model.context.defineProperty('collectionField', {
      value: { filterable: { operators: [opA, opB] }, type: 'string' },
    });

    const ui = defaultOperator.uiMode?.({ model } as any);
    // simulate select props
    const options = ui?.props?.options || [];
    expect(options.find((o: any) => o.value === '$a')).toBeTruthy();
    expect(options.find((o: any) => o.value === '$b')).toBeUndefined();

    // now change meta to boolean and recreate
    model.context.defineProperty('collectionField', {
      value: { filterable: { operators: [opA, opB] }, type: 'boolean' },
    });

    const ui2 = defaultOperator.uiMode?.({ model } as any);
    const options2 = ui2?.props?.options || [];
    expect(options2.find((o: any) => o.value === '$a')).toBeTruthy();
    expect(options2.find((o: any) => o.value === '$b')).toBeTruthy();
  });
});
