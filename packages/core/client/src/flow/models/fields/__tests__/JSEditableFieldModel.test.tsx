/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowEngineProvider, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { get as lodashGet, set as lodashSet } from 'lodash';
import { JSEditableFieldModel, getDefaultEditableJsCode } from '../JSEditableFieldModel';

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

const REQUEST_AND_RENDER_CODE = `
const React = ctx.React;
ctx.request({ url: 'users:list' }).then(() => {
  ctx.render(<span data-testid="js-request-ready">done</span>);
});
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
    collectionField?: Record<string, any>;
    i18n?: {
      t?: (key: string, options?: unknown) => string;
      language?: string;
    };
    app?: {
      apiClient?: {
        request?: (options: unknown) => unknown;
      };
    };
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
  if (options?.collectionField) {
    parent.subModels.field.context.defineProperty('collectionField', { value: options.collectionField });
  }
  if (options?.i18n) {
    engine.context.defineProperty('i18n', { value: options.i18n });
    parent.context.defineProperty('i18n', { value: options.i18n });
    parent.subModels.field.context.defineProperty('i18n', { value: options.i18n });
  }
  if (options?.app) {
    engine.context.defineProperty('app', { value: options.app });
    parent.context.defineProperty('app', { value: options.app });
    if (options.app.apiClient) {
      engine.context.defineProperty('api', { value: options.app.apiClient });
      parent.context.defineProperty('api', { value: options.app.apiClient });
      parent.subModels.field.context.defineProperty('api', { value: options.app.apiClient });
    }
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
  describe('getDefaultEditableJsCode', () => {
    it('uses the input template for regular input fields', () => {
      expect(getDefaultEditableJsCode({ collectionField: { interface: 'input' } })).toContain('JsEditableField');
    });

    it('uses a single select template for select-like fields', () => {
      expect(getDefaultEditableJsCode({ collectionField: { interface: 'select' } })).toContain('JsSelectField');
      expect(getDefaultEditableJsCode({ collectionField: { interface: 'radioGroup' } })).toContain('JsSelectField');
    });

    it('uses a multiple select template for multiple option fields', () => {
      expect(getDefaultEditableJsCode({ collectionField: { interface: 'multipleSelect' } })).toContain(
        'JsMultipleSelectField',
      );
      expect(getDefaultEditableJsCode({ collectionField: { interface: 'checkboxGroup' } })).toContain(
        'JsMultipleSelectField',
      );
    });

    it('uses a yes/no select template for checkbox fields', () => {
      const code = getDefaultEditableJsCode({ collectionField: { interface: 'checkbox' } });

      expect(code).toContain('JsCheckboxSelectField');
      expect(code).toContain("ctx.t('Yes')");
      expect(code).toContain("ctx.t('No')");
    });

    it('uses an association select template for association fields', () => {
      const code = getDefaultEditableJsCode({
        collectionField: {
          interface: 'm2o',
          isAssociationField: () => true,
        },
      });

      expect(code).toContain('JsAssociationSelectField');
      expect(code).toContain("field.target + ':list'");
      expect(code).toContain("'X-Data-Source': dataSourceKey");
      expect(code).toContain('uniqueRecords');
      expect(code).toContain('labelOf');
      expect(code).toContain('...selectProps');
      expect(code).toContain('allowMultiple !== false');
      expect(code).not.toContain('filterByTk');
    });
  });

  it('translates local select option labels in the default code dropdown', async () => {
    const collectionField = {
      interface: 'select',
    };

    renderParentFieldWithFlowRenderer(
      {
        options: [{ label: '{{t("Draft")}}', value: 'draft' }],
      },
      undefined,
      getDefaultEditableJsCode({ collectionField }),
      {
        collectionField,
        i18n: {
          t: (key) => (key === 'Draft' ? '草稿' : key),
        },
      },
    );

    const comboboxes = await screen.findAllByRole('combobox');
    fireEvent.mouseDown(comboboxes[comboboxes.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('草稿')).toBeInTheDocument();
    });
  });

  it('translates local multiple select option labels in default code read only mode', async () => {
    const collectionField = {
      interface: 'multipleSelect',
      uiSchema: {
        enum: [{ label: '{{t("Draft")}}', value: 'draft' }],
      },
    };

    renderParentFieldWithFlowRenderer(
      {
        pattern: 'readPretty',
        value: ['draft'],
      },
      undefined,
      getDefaultEditableJsCode({ collectionField }),
      {
        collectionField,
        i18n: {
          t: (key) => (key === 'Draft' ? '草稿' : key),
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByText('草稿')).toBeInTheDocument();
    });
  });

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

  it('exposes app apiClient request to editable JavaScript', async () => {
    const request = vi.fn().mockResolvedValue({ data: { data: [] } });

    renderParentFieldWithFlowRenderer({ value: 'hello' }, undefined, REQUEST_AND_RENDER_CODE, {
      app: {
        apiClient: {
          request,
        },
      },
    });

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith({ url: 'users:list' });
      expect(screen.getByTestId('js-request-ready')).toHaveTextContent('done');
    });
  });

  it('renders association options with explicit fieldNames using the default code', async () => {
    const collectionField = {
      interface: 'm2o',
      type: 'belongsTo',
      target: 'users',
      dataSourceKey: 'main',
      targetCollection: {
        filterTargetKey: ['id'],
        titleCollectionField: { name: 'name' },
      },
      isAssociationField: () => true,
    };
    const request = vi.fn().mockResolvedValue({ data: { data: [{ id: 1, name: 'Alice' }] } });

    renderParentFieldWithFlowRenderer(
      {
        fieldNames: { label: 'name', value: 'id' },
      },
      undefined,
      getDefaultEditableJsCode({ collectionField }),
      {
        collectionField,
        app: {
          apiClient: {
            request,
          },
        },
      },
    );

    expect(request).not.toHaveBeenCalled();

    const comboboxes = await screen.findAllByRole('combobox');
    fireEvent.mouseDown(comboboxes[comboboxes.length - 1]);

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'users:list',
          headers: { 'X-Data-Source': 'main' },
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });

  it('does not duplicate selected association records in default code options', async () => {
    const collectionField = {
      interface: 'm2o',
      type: 'belongsTo',
      target: 'users',
      targetCollection: {
        filterTargetKey: ['id'],
        titleCollectionField: { name: 'name' },
      },
      isAssociationField: () => true,
    };
    const request = vi.fn().mockResolvedValue({ data: { data: [{ id: 1, name: 'Alice' }] } });

    renderParentFieldWithFlowRenderer(
      {
        value: { id: 1, name: 'Alice' },
        fieldNames: { label: 'name', value: 'id' },
      },
      undefined,
      getDefaultEditableJsCode({ collectionField }),
      {
        collectionField,
        app: {
          apiClient: {
            request,
          },
        },
      },
    );

    fireEvent.mouseDown(await screen.findByRole('combobox'));

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: 'Alice' })).toHaveLength(1);
    });
  });

  it('translates association option labels in the default code dropdown', async () => {
    const collectionField = {
      interface: 'm2m',
      type: 'belongsToMany',
      target: 'roles',
      targetCollection: {
        filterTargetKey: ['id'],
        titleCollectionField: { name: 'name' },
      },
      isAssociationField: () => true,
    };
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [
          { id: 1, name: '{{t("Member")}}' },
          { id: 2, name: '{{t("Admin")}}' },
          { id: 3, name: '{{t("Root")}}' },
        ],
      },
    });

    renderParentFieldWithFlowRenderer(
      {
        value: [
          { id: 1, name: '{{t("Member")}}' },
          { id: 2, name: '{{t("Admin")}}' },
        ],
        fieldNames: { label: 'name', value: 'id' },
      },
      undefined,
      getDefaultEditableJsCode({ collectionField }),
      {
        collectionField,
        i18n: {
          t: (key) =>
            (
              ({
                Member: '成员',
                Admin: '管理员',
                Root: '根用户',
              }) as Record<string, string>
            )[key] || key,
        },
        app: {
          apiClient: {
            request,
          },
        },
      },
    );

    const comboboxes = await screen.findAllByRole('combobox');
    fireEvent.mouseDown(comboboxes[comboboxes.length - 1]);

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: '成员' })).toHaveLength(1);
      expect(screen.getAllByRole('option', { name: '管理员' })).toHaveLength(1);
      expect(screen.getByText('根用户')).toBeInTheDocument();
      expect(screen.queryByText('{{t("Root")}}')).not.toBeInTheDocument();
    });
  });

  it('writes a single association record when to-many allowMultiple is false in the default code', async () => {
    const collectionField = {
      interface: 'm2m',
      type: 'belongsToMany',
      target: 'users',
      dataSourceKey: 'main',
      targetCollection: {
        filterTargetKey: ['id'],
        titleCollectionField: { name: 'name' },
      },
      isAssociationField: () => true,
    };
    const form = createFormStub({});
    const request = vi.fn().mockResolvedValue({ data: { data: [{ id: 2, name: 'Bob' }] } });

    renderParentFieldWithFlowRenderer(
      {
        name: 'assignee',
        fieldNames: { label: 'name', value: 'id' },
        allowMultiple: false,
        multiple: true,
      },
      undefined,
      getDefaultEditableJsCode({ collectionField }),
      {
        collectionField,
        form,
        fieldStepParams: {
          fieldSettings: {
            init: {
              fieldPath: 'assignee',
            },
          },
        },
        app: {
          apiClient: {
            request,
          },
        },
      },
    );

    expect(request).not.toHaveBeenCalled();

    fireEvent.mouseDown(await screen.findByRole('combobox'));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'users:list',
          headers: { 'X-Data-Source': 'main' },
        }),
      );
    });

    fireEvent.click(await screen.findByText('Bob'));

    await waitFor(() => {
      expect(form.getFieldValue(['assignee'])).toEqual({ id: 2, name: 'Bob' });
    });
  });

  it('translates selected association labels in read only mode without loading remote records', async () => {
    const collectionField = {
      interface: 'm2o',
      type: 'belongsTo',
      target: 'users',
      dataSourceKey: 'external',
      targetCollection: {
        filterTargetKey: ['id'],
        titleCollectionField: { name: 'name' },
      },
      isAssociationField: () => true,
    };
    const request = vi.fn().mockResolvedValue({ data: { data: [] } });

    renderParentFieldWithFlowRenderer(
      {
        pattern: 'readPretty',
        value: { id: 3, name: '{{t("Member")}}' },
        fieldNames: { label: 'name', value: 'id' },
      },
      undefined,
      getDefaultEditableJsCode({ collectionField }),
      {
        collectionField,
        i18n: {
          t: (key) => (key === 'Member' ? '成员' : key),
        },
        app: {
          apiClient: {
            request,
          },
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByText('成员')).toBeInTheDocument();
    });
    expect(screen.queryByText('{{t("Member")}}')).not.toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });

  it('falls back to association value keys in read only mode', async () => {
    const collectionField = {
      interface: 'm2o',
      type: 'belongsTo',
      target: 'users',
      targetCollection: {
        filterTargetKey: ['id'],
        titleCollectionField: { name: 'name' },
      },
      isAssociationField: () => true,
    };

    renderParentFieldWithFlowRenderer(
      {
        pattern: 'readPretty',
        value: { id: 3 },
        fieldNames: { label: 'name', value: 'id' },
      },
      undefined,
      getDefaultEditableJsCode({ collectionField }),
      {
        collectionField,
      },
    );

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
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
