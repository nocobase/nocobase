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
import { get as lodashGet, set as lodashSet } from 'lodash';
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

const SET_VALUE_AND_RENDER_NAME_PATH_CODE = `
const React = ctx.React;
ctx.setValue?.('44');
ctx.render(<span data-testid="js-name-path">{JSON.stringify(ctx.namePath)}</span>);
`;

function createFormStub(initialValues: any = {}) {
  const store = JSON.parse(JSON.stringify(initialValues));
  return {
    getFieldValue: (namePath: any) => lodashGet(store, namePath),
    setFieldValue: (namePath: any, value: any) => lodashSet(store, namePath, value),
    getFieldsValue: () => store,
  };
}

class ParentModel extends FlowModel<any> {
  render() {
    return <FlowModelRenderer model={this.subModels.field} />;
  }
}

function renderParentFieldWithFlowRenderer(
  fieldProps?: Record<string, any>,
  parentProps?: Record<string, any>,
  code = EDITABLE_CODE,
  options?: {
    fieldIndex?: string[];
    fieldStepParams?: Record<string, any>;
    form?: any;
  },
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
          ...(options?.fieldStepParams || {}),
          jsSettings: {
            runJs: {
              code,
            },
          },
        },
      },
    },
  });

  if (options?.form) {
    parent.context.defineProperty('form', { value: options.form });
  }
  if (options?.fieldIndex) {
    parent.subModels.field.context.defineProperty('fieldIndex', { value: options.fieldIndex });
  }

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

  it('writes top-level form values through the effective name path', async () => {
    const form = createFormStub({});

    renderParentFieldWithFlowRenderer({ name: 'staffname' }, undefined, SET_VALUE_AND_RENDER_NAME_PATH_CODE, {
      form,
      fieldStepParams: {
        fieldSettings: {
          init: {
            fieldPath: 'staffname',
          },
        },
      },
    });

    await waitFor(() => {
      expect(form.getFieldValue(['staffname'])).toBe('44');
      expect(screen.getByTestId('js-name-path')).toHaveTextContent(JSON.stringify(['staffname']));
    });
  });

  it('writes subform list values under the association path instead of the form root', async () => {
    const form = createFormStub({ org_o2m: [{}] });

    renderParentFieldWithFlowRenderer({ name: 'orgname' }, undefined, SET_VALUE_AND_RENDER_NAME_PATH_CODE, {
      form,
      fieldIndex: ['org_o2m:0'],
      fieldStepParams: {
        fieldSettings: {
          init: {
            fieldPath: 'orgname',
            associationPathName: 'org_o2m',
          },
        },
      },
    });

    await waitFor(() => {
      expect(form.getFieldValue(['org_o2m', 0, 'orgname'])).toBe('44');
      expect(form.getFieldValue(['orgname'])).toBeUndefined();
      expect(screen.getByTestId('js-name-path')).toHaveTextContent(JSON.stringify(['org_o2m', 0, 'orgname']));
    });
  });

  it('writes nested subform list values with the full field index chain', async () => {
    const form = createFormStub({ users: [{ roles: [{}, {}] }] });

    renderParentFieldWithFlowRenderer({ name: 'roleName' }, undefined, SET_VALUE_AND_RENDER_NAME_PATH_CODE, {
      form,
      fieldIndex: ['users:0', 'roles:1'],
      fieldStepParams: {
        fieldSettings: {
          init: {
            fieldPath: 'roleName',
            associationPathName: 'users.roles',
          },
        },
      },
    });

    await waitFor(() => {
      expect(form.getFieldValue(['users', 0, 'roles', 1, 'roleName'])).toBe('44');
      expect(form.getFieldValue(['roleName'])).toBeUndefined();
      expect(screen.getByTestId('js-name-path')).toHaveTextContent(
        JSON.stringify(['users', 0, 'roles', 1, 'roleName']),
      );
    });
  });
});
