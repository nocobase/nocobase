/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { App, ConfigProvider } from 'antd';
import { createForm } from '@formily/core';
import { Field, FormProvider } from '@formily/react';
import { fireEvent, render, screen, waitFor } from '@nocobase/test/client';
import { act } from '@testing-library/react';
import { FlowEngine, FlowEngineProvider, FlowModel, FlowModelProvider } from '@nocobase/flow-engine';
import * as operators from '../../../../../collection-manager/interfaces/properties/operators';

import { FieldOperatorSelect } from '../FieldOperatorSelect';
import { resolveCustomFieldOperatorList, resolveDefaultCustomFieldOperator } from '../customFieldOperators';

class HostModel extends FlowModel {
  render() {
    return null;
  }
}

function createEngineWithCollections() {
  const engine = new FlowEngine();
  engine.registerModels({ HostModel });
  const ds = engine.dataSourceManager.getDataSource('main');
  ds.addCollection({
    name: 'users',
    titleField: 'uid',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
      { name: 'uid', type: 'string', interface: 'input', filterable: { operators: [] } },
      { name: 'createdAt', type: 'date', interface: 'datetime', filterable: { operators: [] } },
      {
        name: 'pluginInSource',
        type: 'integer',
        interface: 'number',
        filterable: {
          operators: [
            { label: '{{t("=")}}', value: '$eq' },
            { label: '{{t("≠")}}', value: '$ne' },
            {
              label: 'plugin-in',
              value: '$in',
              schema: { 'x-component': 'MultipleKeywordsInput' },
            },
            {
              label: 'plugin-notIn',
              value: '$notIn',
              schema: { 'x-component': 'MultipleKeywordsInput' },
            },
            { label: '{{t("is empty")}}', value: '$empty', noValue: true },
            { label: '{{t("is not empty")}}', value: '$notEmpty', noValue: true },
          ],
        },
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
  return engine;
}

describe('custom field operators', () => {
  it('adapts options by field model and mode', () => {
    const engine = createEngineWithCollections();

    const singleSelectOps = resolveCustomFieldOperatorList({
      flowEngine: engine,
      fieldModel: 'SelectFieldModel',
      fieldModelProps: { mode: '' },
    });
    expect(singleSelectOps.some((item) => item.value === '$eq')).toBe(true);
    expect(singleSelectOps.some((item) => item.value === '$match')).toBe(false);

    const multipleSelectOps = resolveCustomFieldOperatorList({
      flowEngine: engine,
      fieldModel: 'SelectFieldModel',
      fieldModelProps: { mode: 'multiple' },
    });
    expect(multipleSelectOps.some((item) => item.value === '$match')).toBe(true);
    expect(multipleSelectOps.some((item) => item.value === '$eq')).toBe(false);

    const checkboxGroupOps = resolveCustomFieldOperatorList({
      flowEngine: engine,
      fieldModel: 'CheckboxGroupFieldModel',
      fieldModelProps: {},
    });
    expect(checkboxGroupOps.some((item) => item.value === '$match')).toBe(true);
  });

  it('resolves record select operators by value field and multiple mode', () => {
    const engine = createEngineWithCollections();

    const singleNumberValueOps = resolveCustomFieldOperatorList({
      flowEngine: engine,
      fieldModel: 'FilterFormCustomRecordSelectFieldModel',
      fieldModelProps: {
        recordSelectDataSourceKey: 'main',
        recordSelectTargetCollection: 'users',
        recordSelectValueField: 'id',
        allowMultiple: false,
        multiple: false,
      },
    });
    expect(singleNumberValueOps.some((item) => item.value === '$gt')).toBe(true);
    expect(singleNumberValueOps.some((item) => item.value === '$includes')).toBe(false);

    const singleStringValueOps = resolveCustomFieldOperatorList({
      flowEngine: engine,
      fieldModel: 'FilterFormCustomRecordSelectFieldModel',
      fieldModelProps: {
        recordSelectDataSourceKey: 'main',
        recordSelectTargetCollection: 'users',
        recordSelectValueField: 'uid',
        allowMultiple: false,
        multiple: false,
      },
    });
    expect(singleStringValueOps.some((item) => item.value === '$includes')).toBe(true);

    const multipleNumberValueOps = resolveCustomFieldOperatorList({
      flowEngine: engine,
      fieldModel: 'FilterFormCustomRecordSelectFieldModel',
      fieldModelProps: {
        recordSelectDataSourceKey: 'main',
        recordSelectTargetCollection: 'users',
        recordSelectValueField: 'id',
        allowMultiple: true,
        multiple: true,
      },
    });
    expect(multipleNumberValueOps.some((item) => item.value === '$in')).toBe(true);
    expect(multipleNumberValueOps.findIndex((item) => item.value === '$notIn')).toBe(
      multipleNumberValueOps.findIndex((item) => item.value === '$in') + 1,
    );
    expect(multipleNumberValueOps.some((item) => item.value === '$gt')).toBe(false);
    expect(multipleNumberValueOps.some((item) => item.value === '$includes')).toBe(false);

    const multipleStringValueOps = resolveCustomFieldOperatorList({
      flowEngine: engine,
      fieldModel: 'FilterFormCustomRecordSelectFieldModel',
      fieldModelProps: {
        recordSelectDataSourceKey: 'main',
        recordSelectTargetCollection: 'users',
        recordSelectValueField: 'uid',
        allowMultiple: true,
        multiple: true,
      },
    });
    expect(multipleStringValueOps.some((item) => item.value === '$in')).toBe(true);
    expect(multipleStringValueOps.some((item) => item.value === '$includes')).toBe(true);

    const multipleDateValueOps = resolveCustomFieldOperatorList({
      flowEngine: engine,
      fieldModel: 'FilterFormCustomRecordSelectFieldModel',
      fieldModelProps: {
        recordSelectDataSourceKey: 'main',
        recordSelectTargetCollection: 'users',
        recordSelectValueField: 'createdAt',
        allowMultiple: true,
        multiple: true,
      },
    });
    expect(multipleDateValueOps.some((item) => item.value === '$in')).toBe(true);
    expect(multipleDateValueOps.some((item) => item.value === '$notIn')).toBe(true);
  });

  it('does not rely on enum operators for record select multiple in/notIn', () => {
    const engine = createEngineWithCollections();
    const originalEnumOperators = [...(operators.enumType || [])];
    operators.enumType.splice(
      0,
      operators.enumType.length,
      ...operators.enumType.filter((item) => item.value !== '$in' && item.value !== '$notIn'),
    );

    try {
      const multipleNumberValueOps = resolveCustomFieldOperatorList({
        flowEngine: engine,
        fieldModel: 'FilterFormCustomRecordSelectFieldModel',
        fieldModelProps: {
          recordSelectDataSourceKey: 'main',
          recordSelectTargetCollection: 'users',
          recordSelectValueField: 'id',
          allowMultiple: true,
          multiple: true,
        },
      });
      expect(multipleNumberValueOps.some((item) => item.value === '$in')).toBe(true);
      expect(multipleNumberValueOps.some((item) => item.value === '$notIn')).toBe(true);

      const multipleStringValueOps = resolveCustomFieldOperatorList({
        flowEngine: engine,
        fieldModel: 'FilterFormCustomRecordSelectFieldModel',
        fieldModelProps: {
          recordSelectDataSourceKey: 'main',
          recordSelectTargetCollection: 'users',
          recordSelectValueField: 'uid',
          allowMultiple: true,
          multiple: true,
        },
      });
      expect(multipleStringValueOps.some((item) => item.value === '$in')).toBe(true);
      expect(multipleStringValueOps.some((item) => item.value === '$notIn')).toBe(true);

      const multipleDateValueOps = resolveCustomFieldOperatorList({
        flowEngine: engine,
        fieldModel: 'FilterFormCustomRecordSelectFieldModel',
        fieldModelProps: {
          recordSelectDataSourceKey: 'main',
          recordSelectTargetCollection: 'users',
          recordSelectValueField: 'createdAt',
          allowMultiple: true,
          multiple: true,
        },
      });
      expect(multipleDateValueOps.some((item) => item.value === '$in')).toBe(true);
      expect(multipleDateValueOps.some((item) => item.value === '$notIn')).toBe(true);
    } finally {
      operators.enumType.splice(0, operators.enumType.length, ...originalEnumOperators);
    }
  });

  it('normalizes in/notIn operators even when source field provides plugin variants', () => {
    const engine = createEngineWithCollections();
    const operatorList = resolveCustomFieldOperatorList({
      flowEngine: engine,
      fieldModel: 'FilterFormCustomRecordSelectFieldModel',
      fieldModelProps: {
        recordSelectDataSourceKey: 'main',
        recordSelectTargetCollection: 'users',
        recordSelectValueField: 'pluginInSource',
        allowMultiple: true,
        multiple: true,
      },
    });

    const inOperator = operatorList.find((item) => item.value === '$in');
    const notInOperator = operatorList.find((item) => item.value === '$notIn');
    expect(inOperator?.schema?.['x-component']).toBe('Select');
    expect(notInOperator?.schema?.['x-component']).toBe('Select');
    expect(operatorList.findIndex((item) => item.value === '$notIn')).toBe(
      operatorList.findIndex((item) => item.value === '$in') + 1,
    );
  });

  it('prefers date between as default when range is enabled', () => {
    const engine = createEngineWithCollections();
    const op = resolveDefaultCustomFieldOperator({
      flowEngine: engine,
      fieldModel: 'DateTimeFilterFieldModel',
      fieldModelProps: { isRange: true },
    });
    expect(op).toBe('$dateBetween');
  });

  it('auto resets selected operator when field model changes', async () => {
    const engine = createEngineWithCollections();
    const host = engine.createModel<HostModel>({
      uid: 'host-operator-select',
      use: 'HostModel',
    });

    let currentOperator: string | undefined;
    const TestSelect: React.FC<{ fieldModel: string; fieldModelProps?: Record<string, any> }> = ({
      fieldModel,
      fieldModelProps,
    }) => {
      const [value, setValue] = React.useState<string>();
      React.useEffect(() => {
        currentOperator = value;
      }, [value]);
      return (
        <FieldOperatorSelect
          fieldModel={fieldModel}
          fieldModelProps={fieldModelProps}
          value={value}
          onChange={setValue}
        />
      );
    };

    const { rerender } = render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelProvider model={host}>
              <TestSelect fieldModel="InputFieldModel" />
            </FlowModelProvider>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(currentOperator).toBe('$includes');
    });

    rerender(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelProvider model={host}>
              <TestSelect fieldModel="NumberFieldModel" />
            </FlowModelProvider>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(currentOperator).toBe('$eq');
    });
  });

  it('auto updates operator when select mode changes', async () => {
    const engine = createEngineWithCollections();
    const host = engine.createModel<HostModel>({
      uid: 'host-operator-select-mode',
      use: 'HostModel',
    });

    let currentOperator: string | undefined;
    const TestSelect: React.FC<{ fieldModelProps?: Record<string, any> }> = ({ fieldModelProps }) => {
      const [value, setValue] = React.useState<string>('$eq');
      React.useEffect(() => {
        currentOperator = value;
      }, [value]);
      return (
        <FieldOperatorSelect
          fieldModel="SelectFieldModel"
          fieldModelProps={fieldModelProps}
          value={value}
          onChange={setValue}
        />
      );
    };

    const { rerender } = render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelProvider model={host}>
              <TestSelect fieldModelProps={{ mode: '' }} />
            </FlowModelProvider>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(currentOperator).toBe('$eq');
    });

    rerender(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelProvider model={host}>
              <TestSelect fieldModelProps={{ mode: 'multiple' }} />
            </FlowModelProvider>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(currentOperator).toBe('$match');
    });
  });

  it('auto updates operator when record select value field changes', async () => {
    const engine = createEngineWithCollections();
    const host = engine.createModel<HostModel>({
      uid: 'host-operator-record-select-value-field',
      use: 'HostModel',
    });

    let currentOperator: string | undefined;
    const TestSelect: React.FC<{ fieldModelProps?: Record<string, any> }> = ({ fieldModelProps }) => {
      const [value, setValue] = React.useState<string>('$gt');
      React.useEffect(() => {
        currentOperator = value;
      }, [value]);
      return (
        <FieldOperatorSelect
          fieldModel="FilterFormCustomRecordSelectFieldModel"
          fieldModelProps={fieldModelProps}
          value={value}
          onChange={setValue}
        />
      );
    };

    const { rerender } = render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelProvider model={host}>
              <TestSelect
                fieldModelProps={{
                  recordSelectDataSourceKey: 'main',
                  recordSelectTargetCollection: 'users',
                  recordSelectValueField: 'id',
                  allowMultiple: false,
                  multiple: false,
                }}
              />
            </FlowModelProvider>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(currentOperator).toBe('$gt');
    });

    rerender(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelProvider model={host}>
              <TestSelect
                fieldModelProps={{
                  recordSelectDataSourceKey: 'main',
                  recordSelectTargetCollection: 'users',
                  recordSelectValueField: 'uid',
                  allowMultiple: false,
                  multiple: false,
                }}
              />
            </FlowModelProvider>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(currentOperator).toBe('$includes');
    });
  });

  it('updates operator option list when record select value field changes in multiple mode', async () => {
    const engine = createEngineWithCollections();
    const host = engine.createModel<HostModel>({
      uid: 'host-operator-record-select-value-field-multiple',
      use: 'HostModel',
    });

    const TestSelect: React.FC<{ fieldModelProps?: Record<string, any> }> = ({ fieldModelProps }) => {
      const [value, setValue] = React.useState<string>('$in');
      return (
        <FieldOperatorSelect
          fieldModel="FilterFormCustomRecordSelectFieldModel"
          fieldModelProps={fieldModelProps}
          value={value}
          onChange={setValue}
        />
      );
    };

    const { container, rerender } = render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelProvider model={host}>
              <TestSelect
                fieldModelProps={{
                  recordSelectDataSourceKey: 'main',
                  recordSelectTargetCollection: 'users',
                  recordSelectValueField: 'id',
                  allowMultiple: true,
                  multiple: true,
                }}
              />
            </FlowModelProvider>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    const selector = container.querySelector('.ant-select-selector');
    expect(selector).toBeTruthy();
    fireEvent.mouseDown(selector!);

    await waitFor(() => {
      expect(screen.queryByText('contains')).not.toBeInTheDocument();
    });

    rerender(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelProvider model={host}>
              <TestSelect
                fieldModelProps={{
                  recordSelectDataSourceKey: 'main',
                  recordSelectTargetCollection: 'users',
                  recordSelectValueField: 'uid',
                  allowMultiple: true,
                  multiple: true,
                }}
              />
            </FlowModelProvider>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    const selectorAfterRerender = container.querySelector('.ant-select-selector');
    expect(selectorAfterRerender).toBeTruthy();
    fireEvent.mouseDown(selectorAfterRerender!);

    await waitFor(() => {
      expect(screen.getByText('contains')).toBeInTheDocument();
    });
  });

  it('reacts to form value changes even when component props keep stale fieldModelProps', async () => {
    const engine = createEngineWithCollections();
    const host = engine.createModel<HostModel>({
      uid: 'host-form-values-driven-operator',
      use: 'HostModel',
    });
    const form = createForm({
      values: {
        fieldModel: 'SelectFieldModel',
        fieldModelProps: {
          mode: '',
        },
      },
    });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FormProvider form={form}>
              <FlowModelProvider model={host}>
                <Field
                  name="operator"
                  component={[
                    FieldOperatorSelect,
                    {
                      fieldModel: 'SelectFieldModel',
                      fieldModelProps: {
                        mode: '',
                      },
                    },
                  ]}
                />
              </FlowModelProvider>
            </FormProvider>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(form.values?.operator).toBe('$eq');
    });

    await act(async () => {
      form.setValuesIn('fieldModelProps', {
        mode: 'multiple',
      });
    });

    await waitFor(() => {
      expect(form.values?.operator).toBe('$match');
    });
  });

  it('updates value when user selects another operator from dropdown', async () => {
    const engine = createEngineWithCollections();
    const host = engine.createModel<HostModel>({
      uid: 'host-operator-select-click',
      use: 'HostModel',
    });

    let currentOperator: string | undefined = '$eq';
    const TestSelect: React.FC = () => {
      const [value, setValue] = React.useState<string>('$eq');
      React.useEffect(() => {
        currentOperator = value;
      }, [value]);
      return <FieldOperatorSelect fieldModel="NumberFieldModel" value={value} onChange={setValue} />;
    };

    const { container } = render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <FlowModelProvider model={host}>
              <TestSelect />
            </FlowModelProvider>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(currentOperator).toBe('$eq');
    });

    const selector = container.querySelector('.ant-select-selector');
    expect(selector).toBeTruthy();
    fireEvent.mouseDown(selector!);

    const nextOption = await waitFor(() => {
      const options = Array.from(document.querySelectorAll('.ant-select-item-option')) as HTMLElement[];
      const candidate = options.find((option) => option.getAttribute('aria-selected') !== 'true');
      expect(candidate).toBeTruthy();
      return candidate as HTMLElement;
    });

    fireEvent.click(nextOption);

    await waitFor(() => {
      expect(currentOperator).not.toBe('$eq');
    });
  });
});
