/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Form, type FormInstance, type TableProps } from 'antd';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { DisplayItemModel, FlowEngine, FlowEngineProvider, FlowModelProvider } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DetailsItemModel,
  DisplaySubTableFieldModel,
  DisplayTextFieldModel,
  FormAssociationItemModel,
  FormItemModel,
  TableColumnModel,
  aclCheck,
  displayFieldComponent,
  fixed,
  overflowMode,
  titleField,
} from '../../../../index';
import { buildAssociationOptions } from '../../../../actions/displayFieldComponent';
import { rebuildFieldSubModel } from '../../../../internal/utils/rebuildFieldSubModel';

type Row = Record<string, unknown>;
type TableOptions = TableProps<Row>;

const { tableRender } = vi.hoisted(() => ({ tableRender: vi.fn() }));

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (value: string) => value }),
}));

vi.mock('antd', async (importOriginal) => ({
  ...(await importOriginal<typeof import('antd')>()),
  Table: (props: TableOptions) => {
    tableRender(props);
    return <div data-testid="rows">{JSON.stringify(props.dataSource)}</div>;
  },
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  tableRender.mockClear();
});

function setup(parentUse = 'FormAssociationItemModel') {
  const engine = new FlowEngine();
  engine.registerActions({ aclCheck, displayFieldComponent, fixed, overflowMode, titleField });
  engine.registerModels({
    DetailsItemModel,
    DisplaySubTableFieldModel,
    DisplayTextFieldModel,
    FormAssociationItemModel,
    FormItemModel,
    TableColumnModel,
  });
  const dataSource = engine.dataSourceManager.getDataSource('main');
  dataSource.addCollection({
    name: 'users',
    filterTargetKey: 'id',
    titleField: 'name',
    fields: [
      { name: 'id', type: 'integer', interface: 'integer' },
      { name: 'name', type: 'string', interface: 'input' },
    ],
  });
  dataSource.addCollection({
    name: 'orgs',
    fields: [
      { name: 'staff', type: 'belongsToMany', interface: 'm2m', target: 'users' },
      { name: 'reports', type: 'hasMany', interface: 'o2m', target: 'users' },
      { name: 'members', type: 'belongsToArray', interface: 'mbm', target: 'users' },
      { name: 'manager', type: 'belongsTo', interface: 'm2o', target: 'users' },
      { name: 'name', type: 'string', interface: 'input' },
    ],
  });
  dataSource.addCollection({
    name: 'posts',
    fields: [{ name: 'org', type: 'belongsTo', interface: 'm2o', target: 'orgs' }],
  });
  const parent = engine.createModel<FormAssociationItemModel>({
    use: parentUse,
    stepParams: {
      fieldSettings: {
        init: { dataSourceKey: 'main', collectionName: 'posts', fieldPath: 'org.staff' },
      },
    },
  });
  const resource = { getAppends: vi.fn(() => ['staff']), setAppends: vi.fn(), refresh: vi.fn() };
  parent.context.defineProperty('blockModel', {
    value: { collection: dataSource.getCollection('posts'), resource, addAppends: vi.fn() },
  });
  parent.context.defineProperty('flowSettingsEnabled', { value: false });
  parent.context.defineProperty('aclCheck', { value: vi.fn().mockResolvedValue(true) });
  const field = parent.setSubModel('field', { use: 'DisplaySubTableFieldModel', props: { pageSize: 10 } });
  return { engine, parent, field: field as DisplaySubTableFieldModel, resource, dataSource };
}

function tableProps(): TableOptions {
  return tableRender.mock.lastCall[0] as TableOptions;
}

describe('DisplaySubTableFieldModel in association display fields', () => {
  it.each(['staff', 'reports', 'members'])('offers a subtable for the to-many field %s', (fieldName) => {
    const { parent, dataSource } = setup();
    const collectionField = dataSource.getCollection('orgs').getField(fieldName);
    const bindings = FormAssociationItemModel.getBindingsByField(parent.context, collectionField);
    expect(bindings.map((binding) => binding.modelName)).toContain('DisplaySubTableFieldModel');
    expect(buildAssociationOptions(parent.context, FormAssociationItemModel)).toContainEqual({
      label: expect.any(String),
      value: 'DisplaySubTableFieldModel',
    });
  });

  it('keeps the binding scoped and preserves the default title-field display', () => {
    const { parent, dataSource } = setup();
    const collection = dataSource.getCollection('orgs');
    for (const itemModel of [DisplayItemModel, TableColumnModel, FormItemModel]) {
      expect(itemModel.getBindingsByField(parent.context, collection.getField('staff'))).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ modelName: 'DisplaySubTableFieldModel' })]),
      );
    }
    for (const fieldName of ['manager', 'name']) {
      expect(FormAssociationItemModel.getBindingsByField(parent.context, collection.getField(fieldName))).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ modelName: 'DisplaySubTableFieldModel' })]),
      );
    }
    expect(DetailsItemModel.getBindingsByField(parent.context, collection.getField('staff'))).toEqual(
      expect.arrayContaining([expect.objectContaining({ modelName: 'DisplaySubTableFieldModel' })]),
    );
    expect(
      FormAssociationItemModel.getDefaultBindingByField(parent.context, collection.getField('staff'), {
        fallbackToTargetTitleField: true,
      })?.modelName,
    ).toBe('DisplayTextFieldModel');
  });

  it.each([undefined, null, [], { rows: [] }])('renders an empty table for %j', (value) => {
    const { field } = setup();
    field.setProps({ value });
    render(field.render());
    expect(tableProps().dataSource).toEqual([]);
  });

  it('updates rows and resets pagination when the association changes or is cleared', async () => {
    const { field, resource } = setup();
    field.setProps({ value: [{ id: 1, name: 'Alice' }] });
    const view = render(field.render());
    await act(async () => {
      const pagination = tableProps().pagination;
      if (pagination) pagination.onChange?.(3, 10);
    });
    expect(tableProps().pagination).toMatchObject({ current: 3 });
    act(() => {
      field.setProps({ value: { rows: [{ id: 2, name: 'Bob' }] } });
      view.rerender(field.render());
    });
    expect(screen.getByTestId('rows').textContent).toContain('Bob');
    expect(screen.getByTestId('rows').textContent).not.toContain('Alice');
    expect(tableProps().pagination).toMatchObject({ current: 1 });
    act(() => {
      field.setProps({ value: null });
      view.rerender(field.render());
    });
    expect(tableProps().dataSource).toEqual([]);
    expect(resource.refresh).not.toHaveBeenCalled();
  });

  it('sorts nested columns locally without mutating form values or refreshing the form resource', async () => {
    const { field, resource } = setup();
    const rows = [
      { id: 1, name: 'Bob' },
      { id: 2, name: 'Alice' },
    ];
    const original = structuredClone(rows);
    field.setProps({ value: rows });
    render(field.render());
    await act(async () => {
      await tableProps().onChange?.(
        {},
        {},
        { field: 'org.staff.name', order: 'ascend' },
        {
          action: 'sort',
          currentDataSource: rows,
        },
      );
    });
    expect(tableProps().dataSource).toEqual([rows[1], rows[0]]);
    await act(async () => {
      await tableProps().onChange?.(
        {},
        {},
        { field: 'org.staff.name', order: 'descend' },
        {
          action: 'sort',
          currentDataSource: rows,
        },
      );
    });
    expect(tableProps().dataSource).toEqual(rows);
    await act(async () => {
      await tableProps().onChange?.(
        {},
        {},
        { field: 'org.staff.name' },
        {
          action: 'sort',
          currentDataSource: rows,
        },
      );
    });
    expect(tableProps().dataSource).toEqual(rows);
    expect(rows).toEqual(original);
    expect(resource.setAppends).not.toHaveBeenCalled();
    expect(resource.refresh).not.toHaveBeenCalled();
  });

  it('retains resource-based sorting in details fields', async () => {
    const { field, resource } = setup('DetailsItemModel');
    field.setProps({ value: [{ id: 1 }] });
    render(field.render());
    await act(async () => {
      await tableProps().onChange?.(
        {},
        {},
        { field: 'name', order: 'ascend' },
        {
          action: 'sort',
          currentDataSource: [],
        },
      );
    });
    expect(resource.setAppends).toHaveBeenCalledWith(['staff(sort=name)']);
    expect(resource.refresh).toHaveBeenCalledOnce();
  });

  it('uses the configured sort field and keeps local ordering when paginating', async () => {
    const { field, resource } = setup();
    const rows = [{ id: 10 }, { id: 2 }];
    field.setProps({ value: rows });
    render(field.render());
    const column: NonNullable<TableOptions['columns']>[number] & { sortField: string } = {
      sortField: 'org.staff.id',
    };
    await act(async () => {
      await tableProps().onChange?.(
        {},
        {},
        { field: 'other', column, order: 'ascend' },
        {
          action: 'sort',
          currentDataSource: rows,
        },
      );
    });
    expect(tableProps().dataSource).toEqual([rows[1], rows[0]]);
    await act(async () => {
      await tableProps().onChange?.(
        { current: 2 },
        {},
        {},
        {
          action: 'paginate',
          currentDataSource: rows,
        },
      );
    });
    expect(tableProps().dataSource).toEqual([rows[1], rows[0]]);
    expect(resource.refresh).not.toHaveBeenCalled();
  });

  it('follows form association changes without writing displayed records into the form', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const { engine, parent, resource } = setup();
    let form: FormInstance;
    const firstOrg = { id: 1, staff: [{ id: 1, name: 'Alice' }] };
    const secondOrg = { id: 2, staff: [{ id: 2, name: 'Bob' }] };
    function TestForm() {
      const [formInstance] = Form.useForm();
      form = formInstance;
      parent.context.defineProperty('form', { value: formInstance });
      parent.context.defineProperty('formValues', { get: () => formInstance.getFieldsValue(true), cache: false });
      return (
        <Form form={formInstance} initialValues={{ org: firstOrg, note: 'unsaved' }}>
          <FlowModelProvider model={parent}>{parent.renderItem()}</FlowModelProvider>
        </Form>
      );
    }
    render(
      <FlowEngineProvider engine={engine}>
        <TestForm />
      </FlowEngineProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('rows').textContent).toContain('Alice'));
    act(() => form.setFieldValue('org', secondOrg));
    await waitFor(() => expect(screen.getByTestId('rows').textContent).toContain('Bob'));
    expect(form.getFieldsValue(true)).toEqual({ org: secondOrg, note: 'unsaved' });
    act(() => form.setFieldValue('org', null));
    await waitFor(() => expect(tableProps().dataSource).toEqual([]));
    expect(form.getFieldsValue(true)).toEqual({ org: null, note: 'unsaved' });
    expect(resource.refresh).not.toHaveBeenCalled();
  });

  it('keeps nested column paths and column configuration when switching components', async () => {
    const { parent, field } = setup();
    vi.spyOn(parent, 'save').mockResolvedValue(undefined);
    const column = field.addSubModel('columns', {
      use: 'TableColumnModel',
      stepParams: {
        fieldSettings: {
          init: { dataSourceKey: 'main', collectionName: 'posts', fieldPath: 'org.staff.name' },
        },
      },
      subModels: { field: { use: 'DisplayTextFieldModel' } },
    });
    expect(field.context.prefixFieldPath).toBe('org.staff');
    expect(field.collection.name).toBe('users');
    const columnField = column.subModels.field as DisplayTextFieldModel;
    const createFork = vi.spyOn(columnField, 'createFork');
    (column as TableColumnModel).renderItem()(undefined, { id: 1, name: 'Alice' }, 0);
    expect(createFork.mock.results[0].value.props.value).toBe('Alice');
    expect(createFork.mock.results[0].value.context.record).toEqual({ id: 1, name: 'Alice' });
    await rebuildFieldSubModel({ parentModel: parent, targetUse: 'DisplayTextFieldModel' });
    await rebuildFieldSubModel({ parentModel: parent, targetUse: 'DisplaySubTableFieldModel' });
    const rebuilt = parent.subModels.field as DisplaySubTableFieldModel;
    expect(rebuilt.uid).toBe(field.uid);
    expect(rebuilt.serialize().subModels.columns[0]).toMatchObject({
      uid: column.uid,
      stepParams: { fieldSettings: { init: { fieldPath: 'org.staff.name' } } },
    });
  });
});
