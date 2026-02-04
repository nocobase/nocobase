/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { App, ConfigProvider } from 'antd';
import { createForm } from '@formily/core';
import { Field, FormProvider } from '@formily/react';
import { render, waitFor } from '@nocobase/test/client';
import { FlowEngine, FlowEngineProvider, FlowModel, FlowModelProvider, FlowModelRenderer } from '@nocobase/flow-engine';

import { FieldComponentProps } from '../FieldComponentProps';
import { FilterFormCustomFieldModel } from '../FilterFormCustomFieldModel';
import { FilterFormCustomRecordSelectFieldModel } from '../FilterFormCustomRecordSelectFieldModel';

let form: ReturnType<typeof createForm>;

class HostModel extends FlowModel {
  render() {
    const { source } = (this.props || {}) as any;
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
      props: {
        source: ['main', 'posts', 'author'],
      },
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
      fieldModelProps: {
        recordSelectDataSourceKey: 'main',
        recordSelectTargetCollection: 'users',
        recordSelectTitleField: 'name',
      },
    });

    await model.applyFlow('formItemSettings');

    const collectionField = model.context.collectionField as any;
    expect(collectionField?.target).toBe('users');
    expect(collectionField?.targetCollection?.name).toBe('users');

    const instanceProps = model.customFieldModelInstance?.getProps?.() as any;
    expect(instanceProps?.fieldNames).toEqual({
      label: 'name',
      value: 'id',
    });
  });
});
