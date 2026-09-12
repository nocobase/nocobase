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
import { createMockClient, IdFieldInterface, InputFieldInterface } from '@nocobase/client-v2';
import React from 'react';
import { defaultOperator } from '../defaultOperator';

function createModel() {
  const engine = new FlowEngine();
  const model = new FlowModel({ uid: 'm-default-operator', flowEngine: engine });
  return model;
}

type OperatorOption = {
  value: string;
  label?: unknown;
  schema?: Record<string, unknown>;
};

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

  it('resolves default operator options from field interfaces when collection field metadata is absent', () => {
    const app = createMockClient();
    app.addFieldInterfaces([InputFieldInterface]);
    app.addFieldInterfaceOperator('input', {
      label: 'plugin in',
      value: '$in',
      schema: { 'x-component': 'MultipleKeywordsInput' },
    });
    app.addFieldInterfaceOperator('input', {
      label: 'plugin not in',
      value: '$notIn',
      schema: { 'x-component': 'MultipleKeywordsInput' },
    });

    const model = new FlowModel({ uid: 'm-default-operator-interface', flowEngine: app.flowEngine });
    model.context.defineProperty('filterField', {
      value: { name: 'name', title: 'Name', interface: 'input', type: 'string' },
    });

    const ui = defaultOperator.uiMode?.({ model } as any);
    const options = (ui?.props?.options || []) as OperatorOption[];
    expect(options.find((item) => item.value === '$in')?.schema?.['x-component']).toBe('MultipleKeywordsInput');
    expect(options.find((item) => item.value === '$notIn')?.schema?.['x-component']).toBe('MultipleKeywordsInput');
  });

  it('preserves React operator labels', () => {
    const model = createModel();
    const label = <span data-testid="operator-label">plugin label</span>;

    model.context.defineProperty('collectionField', {
      value: {
        filterable: {
          operators: [{ value: '$in', label, schema: { 'x-component': 'MultipleKeywordsInput' } }],
        },
      },
    });

    const ui = defaultOperator.uiMode?.({ model } as any);
    const options = (ui?.props?.options || []) as OperatorOption[];
    expect(options.find((item) => item.value === '$in')?.label).toBe(label);
  });

  it('falls back to id field interface operators when collection field operators are empty', () => {
    const app = createMockClient();
    app.addFieldInterfaces([IdFieldInterface]);
    app.addFieldInterfaceOperator('id', {
      label: 'plugin in',
      value: '$in',
      schema: { 'x-component': 'MultipleKeywordsInput' },
    });
    app.addFieldInterfaceOperator('id', {
      label: 'plugin not in',
      value: '$notIn',
      schema: { 'x-component': 'MultipleKeywordsInput' },
    });

    const model = new FlowModel({ uid: 'm-default-operator-id-interface', flowEngine: app.flowEngine });
    model.context.defineProperty('collectionField', {
      value: {
        name: 'id',
        title: 'ID',
        interface: 'id',
        type: 'bigInt',
        filterable: { operators: [] },
      },
    });
    model.context.defineProperty('filterField', {
      value: { name: 'id', title: 'ID', interface: 'id', type: 'bigInt' },
    });

    const ui = defaultOperator.uiMode?.({ model } as any);
    const options = (ui?.props?.options || []) as OperatorOption[];
    expect(options.find((item) => item.value === '$eq')).toBeTruthy();
    expect(options.find((item) => item.value === '$in')?.schema?.['x-component']).toBe('MultipleKeywordsInput');
    expect(options.find((item) => item.value === '$notIn')?.schema?.['x-component']).toBe('MultipleKeywordsInput');
  });
});
