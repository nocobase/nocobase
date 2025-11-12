/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock flow-engine pieces used by DefaultValue
vi.mock('@nocobase/flow-engine', () => {
  let ctxRef: any = { model: null, t: (s: string) => s, getPropertyMetaTree: () => [] };

  const FlowModelRenderer = ({ model }: any) => {
    const field = model?.subModels?.fields?.[0] || {};
    const value = field?.props?.value;
    const onChange = field?.props?.onChange;
    return (
      <div>
        <div data-testid="value-viewer">{typeof value === 'undefined' ? '' : JSON.stringify(value)}</div>
        <button
          type="button"
          data-testid="choose-past"
          onClick={() => onChange?.({ type: 'past', number: 2, unit: 'day' })}
        >
          choose-past
        </button>
        <button type="button" data-testid="choose-exact" onClick={() => onChange?.('fake-dayjs', '2024-10-01')}>
          choose-exact
        </button>
      </div>
    );
  };

  const VariableInput = (props: any) => {
    const Comp = props?.converters?.renderInputComponent?.({ paths: ['constant'] }) || (() => null);
    return <Comp value={props.value} onChange={props.onChange} />;
  };

  const useFlowContext = () => ctxRef;
  const setMockFlowContext = (ctx: any) => (ctxRef = ctx);

  return { FlowModelRenderer, VariableInput, useFlowContext, setMockFlowContext } as any;
});

// Import after mocks
import { DefaultValue } from '../DefaultValue';

function createCtx(originUse: string, captured: { lastFieldModel?: any } = {}) {
  const engine = {
    createModel: (_args: any) => {
      const fieldModel: any = {
        props: {},
        setProps(p: any) {
          this.props = { ...this.props, ...p };
        },
        setPattern() {},
        context: { collectionField: { isAssociationField: () => false } },
      };
      captured.lastFieldModel = fieldModel;
      return {
        subModels: { fields: [fieldModel] },
        remove() {},
      } as any;
    },
    getModelClass: () => function Dummy() {},
  };
  const model = {
    context: { engine },
    subModels: { field: { use: originUse } },
    getStepParams: () => ({}),
  } as any;
  const ctx = { model, t: (s: string) => s, getPropertyMetaTree: () => [] } as any;
  return ctx;
}

describe('DefaultValue for date-like filter field', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders date dynamic editor and propagates changes (object)', async () => {
    const fe: any = await import('@nocobase/flow-engine');
    const onChange = vi.fn();
    fe.setMockFlowContext(createCtx('DateTimeFilterFieldModel'));

    render(<DefaultValue value={undefined} onChange={onChange} metaTree={[]} model={null as any} />);

    fireEvent.click(screen.getByTestId('choose-past'));
    expect(onChange).toHaveBeenCalledWith({ type: 'past', number: 2, unit: 'day' });
  });

  it('handles antd DatePicker-like onChange signature (dates, dateStrings)', async () => {
    const fe: any = await import('@nocobase/flow-engine');
    const onChange = vi.fn();
    fe.setMockFlowContext(createCtx('DateTimeFilterFieldModel'));

    render(<DefaultValue value={undefined} onChange={onChange} metaTree={[]} model={null as any} />);

    fireEvent.click(screen.getByTestId('choose-exact'));
    expect(onChange).toHaveBeenCalledWith('2024-10-01');
  });

  it('mirrors value into controlled temp field for date-like fields', async () => {
    const fe: any = await import('@nocobase/flow-engine');
    const captured: any = {};
    const ctx = createCtx('DateTimeFilterFieldModel', captured);
    fe.setMockFlowContext(ctx);

    const value = { type: 'past', number: 1, unit: 'day' };
    render(<DefaultValue value={value} onChange={vi.fn()} metaTree={[]} model={null as any} />);

    // value-viewer reflects fieldModel.props.value (controlled)
    expect(screen.getByTestId('value-viewer').textContent).toBe(JSON.stringify(value));
  });

  it('does not force value control for non date-like fields (keeps IME-friendly)', async () => {
    const fe: any = await import('@nocobase/flow-engine');
    const captured: any = {};
    const ctx = createCtx('InputFieldModel', captured);
    fe.setMockFlowContext(ctx);

    render(<DefaultValue value={'text'} onChange={vi.fn()} metaTree={[]} model={null as any} />);
    // value-viewer shows empty string when props.value is not controlled
    expect(screen.getByTestId('value-viewer').textContent).toBe('');
  });
});
