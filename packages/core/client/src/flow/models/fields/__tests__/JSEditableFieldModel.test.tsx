/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowEngineProvider, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { JSEditableFieldModel } from '../JSEditableFieldModel';

function createField(props?: Record<string, any>, code = '') {
  const engine = new FlowEngine();
  engine.registerModels({ JSEditableFieldModel });
  return engine.createModel<JSEditableFieldModel>({
    use: 'JSEditableFieldModel',
    uid: `js-field-${props?.pattern || 'editable'}`,
    props,
    stepParams: {
      jsSettings: {
        runJs: {
          code,
        },
      },
    },
  });
}

function renderField(props?: Record<string, any>, code?: string) {
  const field = createField(props, code);

  render(<>{field.render()}</>);

  return field;
}

const EDITABLE_CODE = `
function JsEditableField() {
  const React = ctx.React;
  const { Input } = ctx.antd;
  const [value, setValue] = React.useState(ctx.getValue?.() ?? '');

  React.useEffect(() => {
    const handler = (ev) => setValue(ev?.detail ?? '');
    ctx.element?.addEventListener('js-field:value-change', handler);
    return () => ctx.element?.removeEventListener('js-field:value-change', handler);
  }, []);

  const onChange = (e) => {
    const v = e?.target?.value ?? '';
    setValue(v);
    ctx.setValue?.(v);
  };

  return (
    <Input
      {...ctx.model.props}
      value={value}
      onChange={onChange}
    />
  );
}

ctx.render(<JsEditableField />);
`;

const READONLY_AWARE_CODE = `
const React = ctx.React;
ctx.render(<span data-testid="js-readonly-state">{String(ctx.readOnly)}</span>);
`;

class ParentModel extends FlowModel<any> {
  render() {
    return <FlowModelRenderer model={this.subModels.field} />;
  }
}

function renderParentFieldWithFlowRenderer(
  fieldProps?: Record<string, any>,
  parentProps?: Record<string, any>,
  code = EDITABLE_CODE,
) {
  const engine = new FlowEngine();
  engine.registerModels({ JSEditableFieldModel, ParentModel });
  const parent = engine.createModel<ParentModel>({
    use: ParentModel,
    uid: 'js-field-parent',
    props: parentProps,
    subModels: {
      field: {
        use: 'JSEditableFieldModel',
        uid: 'js-field-with-parent',
        props: fieldProps,
        stepParams: {
          jsSettings: {
            runJs: {
              code,
            },
          },
        },
      },
    },
  });

  render(
    <FlowEngineProvider engine={engine}>
      <FlowModelRenderer model={parent} />
    </FlowEngineProvider>,
  );

  return parent;
}

describe('JSEditableFieldModel', () => {
  it('renders configured JavaScript in display only mode', async () => {
    const field = renderParentFieldWithFlowRenderer(
      { pattern: 'readPretty', value: 'hello' },
      undefined,
      READONLY_AWARE_CODE,
    ).subModels.field as JSEditableFieldModel;

    await waitFor(() => {
      expect(screen.getByTestId('js-readonly-state')).toHaveTextContent('true');
      expect(field.context.ref.current).toBeInstanceOf(HTMLSpanElement);
    });
  });

  it('renders fallback as text in display only mode when code is empty', () => {
    renderField({ pattern: 'readPretty', value: 'hello' });

    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('hello')).not.toBeInTheDocument();
  });

  it('renders fallback input for editable mode', () => {
    renderField({ value: 'hello' });

    expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
  });

  it('rerenders as text when owner form item switches to display only', async () => {
    const parent = renderParentFieldWithFlowRenderer({ value: 'hello' }, undefined, '');

    await act(async () => {
      parent.setProps({ pattern: 'readPretty' });
    });

    await waitFor(() => {
      expect(screen.getByText('hello')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  it('does not rerun JavaScript settings when field value changes', async () => {
    const parent = renderParentFieldWithFlowRenderer({ value: 'hello' });
    const field = parent.subModels.field as JSEditableFieldModel;
    const applyFlowSpy = vi.spyOn(field, 'applyFlow');

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    applyFlowSpy.mockClear();

    await act(async () => {
      field.setProps({ value: 'hello1' });
    });

    expect(applyFlowSpy).not.toHaveBeenCalled();
  });

  it('coalesces script and pattern changes into one JavaScript settings run', async () => {
    const parent = renderParentFieldWithFlowRenderer({ value: 'hello' }, undefined, '');
    const field = parent.subModels.field as JSEditableFieldModel;
    const applyFlowSpy = vi.spyOn(field, 'applyFlow');

    await act(async () => {
      field.setStepParams('jsSettings', 'runJs', { code: READONLY_AWARE_CODE });
      parent.setProps({ pattern: 'readPretty' });
      field.scheduleApplyJsSettings();
    });

    await waitFor(() => {
      expect(screen.getByTestId('js-readonly-state')).toHaveTextContent('true');
    });

    expect(applyFlowSpy).toHaveBeenCalledTimes(1);
    expect(applyFlowSpy).toHaveBeenCalledWith('jsSettings');
  });

  it('applies JavaScript settings once on initial render', async () => {
    const applyFlowSpy = vi.spyOn(FlowModel.prototype, 'applyFlow');
    renderParentFieldWithFlowRenderer({ value: 'hello' });

    try {
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      expect(applyFlowSpy).toHaveBeenCalledTimes(1);
      expect(applyFlowSpy.mock.calls).toEqual([['jsSettings']]);
    } finally {
      applyFlowSpy.mockRestore();
    }
  });
});
