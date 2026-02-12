/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { App, ConfigProvider } from 'antd';
import { createForm } from '@formily/core';
import { Field, FormProvider } from '@formily/react';
import { fireEvent, render, waitFor } from '@nocobase/test/client';
import {
  FilterableItemModel,
  FlowEngine,
  FlowEngineProvider,
  FlowModel,
  FlowModelProvider,
  FlowModelRenderer,
} from '@nocobase/flow-engine';

import { FieldModelSelect } from '../../FieldModelSelect';
import { FieldComponentProps } from '../FieldComponentProps';
import { FilterFormCustomFieldModel } from '../FilterFormCustomFieldModel';
import { FilterFormCustomRecordSelectFieldModel } from '../FilterFormCustomRecordSelectFieldModel';

let form: ReturnType<typeof createForm>;

class HostModel extends FlowModel {
  render() {
    const source = ['main', 'posts', 'author'];
    return (
      <FormProvider form={form}>
        <FlowModelProvider model={this}>
          <Field
            name="props"
            component={[
              FieldComponentProps,
              {
                fieldModel: 'FilterFormCustomRecordSelectFieldModel',
                source,
              },
            ]}
          />
        </FlowModelProvider>
      </FormProvider>
    );
  }
}

class HostScalarSourceModel extends FlowModel {
  render() {
    const source = ['main', 'roles', 'uid'];
    return (
      <FormProvider form={form}>
        <FlowModelProvider model={this}>
          <Field
            name="props"
            component={[
              FieldComponentProps,
              {
                fieldModel: 'FilterFormCustomRecordSelectFieldModel',
                source,
              },
            ]}
          />
        </FlowModelProvider>
      </FormProvider>
    );
  }
}

class HostFieldModelSelectModel extends FlowModel {
  render() {
    return null;
  }
}

describe('FilterForm custom field record select', () => {
  beforeEach(() => {
    form = createForm();
  });

  it('fills record select config from field source', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ HostModel, FilterFormCustomRecordSelectFieldModel });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'users',
      titleField: 'name',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        { name: 'name', type: 'string', interface: 'input', filterable: { operators: [] } },
      ],
    });
    ds.addCollection({
      name: 'posts',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        { name: 'title', type: 'string', interface: 'input', filterable: { operators: [] } },
        {
          name: 'author',
          type: 'belongsTo',
          interface: 'm2o',
          target: 'users',
          filterable: { operators: [] },
        },
      ],
    });

    const host = engine.createModel<HostModel>({
      uid: 'host',
      use: 'HostModel',
    });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      // @ts-ignore
      const value = form.values?.props;
      expect(value.recordSelectDataSourceKey).toBe('main');
      expect(value.recordSelectTargetCollection).toBe('users');
      expect(value.recordSelectTitleField).toBe('name');
    });
  });

  it('builds collection field context for custom record select', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ FilterFormCustomFieldModel, FilterFormCustomRecordSelectFieldModel });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'users',
      titleField: 'name',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        { name: 'name', type: 'string', interface: 'input', filterable: { operators: [] } },
      ],
    });

    const model = engine.createModel<FilterFormCustomFieldModel>({
      uid: 'custom',
      use: 'FilterFormCustomFieldModel',
    });

    model.setStepParams('formItemSettings', 'fieldSettings', {
      fieldModel: 'FilterFormCustomRecordSelectFieldModel',
      title: 'User',
      name: 'user',
      operator: '$eq',
      fieldModelProps: {
        recordSelectDataSourceKey: 'main',
        recordSelectTargetCollection: 'users',
        recordSelectTitleField: 'name',
        recordSelectValueField: 'id',
      },
    });

    await model.applyFlow('formItemSettings');

    const collectionField = model.customFieldModelInstance?.context?.collectionField as any;
    expect(collectionField?.target).toBe('users');
    expect(collectionField?.targetCollection?.name).toBe('users');

    const instanceProps = model.customFieldModelInstance?.getProps?.() as any;
    expect(instanceProps?.fieldNames).toEqual({
      label: 'name',
      value: 'id',
    });
  });

  it('does not crash when source field has no target and field model is record select', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ HostScalarSourceModel, FilterFormCustomRecordSelectFieldModel });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'roles',
      fields: [
        { name: 'uid', type: 'string', interface: 'input', filterable: { operators: [] } },
        { name: 'name', type: 'string', interface: 'input', filterable: { operators: [] } },
      ],
    });

    const host = engine.createModel<HostScalarSourceModel>({
      uid: 'host-scalar',
      use: 'HostScalarSourceModel',
    });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      // @ts-ignore
      const value = form.values?.props || {};
      expect(value.recordSelectTargetCollection).toBeUndefined();
    });
  });

  it('hides association fields from value field options', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ HostModel, FilterFormCustomRecordSelectFieldModel });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'roles',
      fields: [{ name: 'name', type: 'string', interface: 'input', filterable: { operators: [] } }],
    });
    ds.addCollection({
      name: 'users',
      titleField: 'nickname',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        { name: 'nickname', type: 'string', interface: 'input', filterable: { operators: [] } },
        {
          name: 'hiddenText',
          type: 'string',
          interface: 'input',
          title: 'Hidden text',
          filterable: false,
        },
        {
          name: 'roles',
          type: 'belongsToMany',
          interface: 'm2m',
          target: 'roles',
          title: 'Roles relation',
          filterable: { operators: [] },
        },
      ],
    });
    ds.addCollection({
      name: 'posts',
      fields: [
        {
          name: 'author',
          type: 'belongsTo',
          interface: 'm2o',
          target: 'users',
          filterable: { operators: [] },
        },
      ],
    });

    const host = engine.createModel<HostModel>({
      uid: 'host-value-field-options',
      use: 'HostModel',
    });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelRenderer model={host} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      const value = form.values?.props as any;
      expect(value.recordSelectTargetCollection).toBe('users');
    });

    const valueFieldSelector = await waitFor(() => {
      const selectors = document.querySelectorAll('.ant-select-selector');
      expect(selectors.length).toBeGreaterThanOrEqual(3);
      return selectors[2] as HTMLElement;
    });
    fireEvent.mouseDown(valueFieldSelector);

    await waitFor(() => {
      const optionTexts = Array.from(document.querySelectorAll('.ant-select-item-option-content')).map(
        (node) => node.textContent?.trim(),
      );
      expect(optionTexts).toContain('nickname');
      expect(optionTexts).not.toContain('Hidden text');
      expect(optionTexts).not.toContain('Roles relation');
    });
  });

  it('auto updates field model when source changes', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ HostFieldModelSelectModel });
    const bindingSpy = vi.spyOn(FilterableItemModel, 'getDefaultBindingByField').mockImplementation((_, field) => {
      if (field?.name === 'title') {
        return { modelName: 'InputFieldModel' } as any;
      }
      if (field?.name === 'age') {
        return { modelName: 'NumberFieldModel' } as any;
      }
      return undefined as any;
    });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'posts',
      fields: [
        { name: 'title', type: 'string', interface: 'input', filterable: { operators: [] } },
        { name: 'age', type: 'integer', interface: 'number', filterable: { operators: [] } },
      ],
    });

    const host = engine.createModel<HostFieldModelSelectModel>({
      uid: 'host-field-model-select',
      use: 'HostFieldModelSelectModel',
    });

    let currentFieldModelValue: string | undefined;
    const TestField: React.FC<{ source: string[] }> = ({ source }) => {
      const [value, setValue] = React.useState<string>();
      React.useEffect(() => {
        currentFieldModelValue = value;
      }, [value]);

      return <FieldModelSelect source={source} value={value} onChange={setValue} />;
    };

    const { rerender } = render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelProvider model={host}>
              <TestField source={['main', 'posts', 'title']} />
            </FlowModelProvider>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    try {
      await waitFor(() => {
        expect(currentFieldModelValue).toBe('InputFieldModel');
      });

      rerender(
        <FlowEngineProvider engine={engine}>
          <ConfigProvider>
            <App>
              <FlowModelProvider model={host}>
                <TestField source={['main', 'posts', 'age']} />
              </FlowModelProvider>
            </App>
          </ConfigProvider>
        </FlowEngineProvider>,
      );

      await waitFor(() => {
        expect(currentFieldModelValue).toBe('NumberFieldModel');
      });
    } finally {
      bindingSpy.mockRestore();
    }
  });

  it('falls back to compatible operator when selected operator is invalid for field model', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ FilterFormCustomFieldModel, FilterFormCustomRecordSelectFieldModel });

    const model = engine.createModel<FilterFormCustomFieldModel>({
      uid: 'custom-operator-fallback',
      use: 'FilterFormCustomFieldModel',
    });

    model.setStepParams('formItemSettings', 'fieldSettings', {
      fieldModel: 'SelectFieldModel',
      title: 'Tags',
      name: 'tags',
      operator: '$eq',
      fieldModelProps: {
        mode: 'multiple',
        options: [{ label: 'A', value: 'a' }],
      },
    });

    await model.applyFlow('formItemSettings');

    expect(model.operator).toBe('$match');
  });

  it('keeps custom title field after applying select settings', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ FilterFormCustomFieldModel, FilterFormCustomRecordSelectFieldModel });
    engine.registerActions({
      titleField: {
        name: 'titleField',
        defaultParams: (ctx: any) => ({
          label: ctx.model.context.collectionField.targetCollectionTitleFieldName,
        }),
        handler: (ctx: any, params: any) => {
          const valueField =
            ctx.model.props?.fieldNames?.value || ctx.model.context.collectionField.targetCollection?.filterTargetKey;
          ctx.model.setProps({
            fieldNames: {
              label: params?.label,
              value: valueField || 'id',
            },
          });
        },
      },
      dataScope: {
        name: 'dataScope',
        handler: () => {},
      },
      sortingRule: {
        name: 'sortingRule',
        handler: () => {},
      },
    });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'users',
      titleField: 'nickname',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        { name: 'nickname', type: 'string', interface: 'input', filterable: { operators: [] } },
      ],
    });

    const model = engine.createModel<FilterFormCustomFieldModel>({
      uid: 'custom-keep-title-field',
      use: 'FilterFormCustomFieldModel',
    });

    model.setStepParams('formItemSettings', 'fieldSettings', {
      fieldModel: 'FilterFormCustomRecordSelectFieldModel',
      title: 'User',
      name: 'user',
      operator: '$eq',
      fieldModelProps: {
        recordSelectDataSourceKey: 'main',
        recordSelectTargetCollection: 'users',
        recordSelectTitleField: 'id',
        recordSelectValueField: 'id',
      },
    });

    await model.applyFlow('formItemSettings');

    const customRecordSelect = model.customFieldModelInstance as any;
    expect(customRecordSelect?.props?.fieldNames?.label).toBe('id');

    await customRecordSelect.applyFlow('selectSettings');

    expect(customRecordSelect?.props?.fieldNames?.label).toBe('id');
  });

  it('hydrates options for id defaults in value mode', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ FilterFormCustomFieldModel, FilterFormCustomRecordSelectFieldModel });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'users',
      titleField: 'name',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        { name: 'name', type: 'string', interface: 'input', filterable: { operators: [] } },
      ],
    });

    const model = engine.createModel<FilterFormCustomFieldModel>({
      uid: 'custom-hydrate-options',
      use: 'FilterFormCustomFieldModel',
    });

    model.setStepParams('formItemSettings', 'fieldSettings', {
      fieldModel: 'FilterFormCustomRecordSelectFieldModel',
      title: 'Users',
      name: 'users',
      operator: '$in',
      fieldModelProps: {
        recordSelectDataSourceKey: 'main',
        recordSelectTargetCollection: 'users',
        recordSelectTitleField: 'name',
        recordSelectValueField: 'id',
        valueMode: 'value',
        allowMultiple: true,
        multiple: true,
      },
    });

    await model.applyFlow('formItemSettings');

    const customRecordSelect = model.customFieldModelInstance as any;
    customRecordSelect.setProps({
      value: [2, 3],
      options: [],
    });
    customRecordSelect.resource = {
      addFilterGroup: vi.fn(),
      refresh: vi.fn(async () => {}),
      getData: vi.fn(() => [
        { id: 2, name: 'User 2' },
        { id: 3, name: 'User 3' },
      ]),
      removeFilterGroup: vi.fn(),
    };

    await customRecordSelect.applyFlow('syncValueOptions');

    expect(customRecordSelect?.props?.options).toEqual([
      { id: 2, name: 'User 2' },
      { id: 3, name: 'User 3' },
    ]);
    expect(customRecordSelect.resource.addFilterGroup).toHaveBeenCalledWith('__filter_form_value_options__', {
      'id.$in': [2, 3],
    });
    expect(customRecordSelect.resource.removeFilterGroup).toHaveBeenCalledWith('__filter_form_value_options__');
  });

  it('syncValueOptions always queries by primary key', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ FilterFormCustomFieldModel, FilterFormCustomRecordSelectFieldModel });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'users',
      titleField: 'name',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', interface: 'number', filterable: { operators: [] } },
        { name: 'name', type: 'string', interface: 'input', filterable: { operators: [] } },
      ],
    });

    const model = engine.createModel<FilterFormCustomFieldModel>({
      uid: 'custom-sync-primary-key',
      use: 'FilterFormCustomFieldModel',
    });

    model.setStepParams('formItemSettings', 'fieldSettings', {
      fieldModel: 'FilterFormCustomRecordSelectFieldModel',
      title: 'Users',
      name: 'users',
      operator: '$in',
      fieldModelProps: {
        recordSelectDataSourceKey: 'main',
        recordSelectTargetCollection: 'users',
        recordSelectTitleField: 'name',
        recordSelectValueField: 'name',
        valueMode: 'value',
        allowMultiple: true,
        multiple: true,
      },
    });

    await model.applyFlow('formItemSettings');

    const customRecordSelect = model.customFieldModelInstance as any;
    customRecordSelect.setProps({
      value: [
        { id: 1, name: 'Super Admin' },
        { id: 2, name: 'user1' },
      ],
      options: [{ id: 1, name: 'Super Admin' }],
    });
    customRecordSelect.resource = {
      addFilterGroup: vi.fn(),
      refresh: vi.fn(async () => {}),
      getData: vi.fn(() => [
        { id: 1, name: 'Super Admin' },
        { id: 2, name: 'user1' },
      ]),
      removeFilterGroup: vi.fn(),
    };

    await customRecordSelect.applyFlow('syncValueOptions');

    expect(customRecordSelect.resource.addFilterGroup).toHaveBeenCalledWith('__filter_form_value_options__', {
      'id.$eq': 2,
    });
  });

  it('normalizes record objects to primary keys in value mode', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ FilterFormCustomRecordSelectFieldModel });

    const model = engine.createModel<any>({
      uid: 'custom-value-mode-normalize',
      use: 'FilterFormCustomRecordSelectFieldModel',
      props: {
        valueMode: 'value',
        fieldNames: { label: 'name', value: 'id' },
        value: [
          { id: 2, name: 'User 2' },
          { id: 3, name: 'User 3' },
        ],
      },
    });

    expect(model.getFilterValue()).toEqual([2, 3]);
  });

  it('does not expose default value step in custom field settings', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ FilterFormCustomFieldModel, FilterFormCustomRecordSelectFieldModel });

    const model = engine.createModel<FilterFormCustomFieldModel>({
      uid: 'custom-without-default-value-step',
      use: 'FilterFormCustomFieldModel',
    });

    const initialValueStep = model.getFlow('formItemSettings')?.steps?.initialValue;
    expect(initialValueStep).toBeUndefined();
  });
});
