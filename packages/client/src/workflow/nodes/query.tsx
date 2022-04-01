import React from 'react';
import { useForm } from '@formily/react';
import { action } from '@formily/reactive';
import { t } from 'i18next';

import { useRequest, useCollectionManager } from '../..';
import { useCollectionFilterOptions } from '../../collection-manager/action-hooks';
import { Select } from 'antd';
import { useFlowContext } from '../WorkflowCanvas';
import { css } from '@emotion/css';

const BaseTypeSet = new Set(['boolean', 'number', 'string', 'date']);

export default {
  title: '数据查询',
  type: 'query',
  group: 'model',
  fieldset: {
    collection: {
      type: 'string',
      title: '数据表',
      name: 'collection',
      required: true,
      'x-reactions': ['{{useCollectionDataSource()}}'],
      'x-decorator': 'FormItem',
      'x-component': 'Select',
    },
    multiple: {
      type: 'boolean',
      title: '多条数据',
      name: 'multiple',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-component-props': {
        disabled: true
      }
    },
    params: {
      type: 'object',
      name: 'params',
      title: '查询参数',
      'x-decorator': 'FormItem',
      properties: {
        filter: {
          type: 'object',
          title: '筛选条件',
          name: 'filter',
          'x-decorator': 'div',
          'x-decorator-props': {
            className: css`
              .ant-select{
                width: auto;
              }
            `
          },
          'x-component': 'Filter',
          'x-component-props': {
            useDataSource(options) {
              const { values } = useForm();
              const data = useCollectionFilterOptions(values.collection);
              return useRequest(() => Promise.resolve({
                data
              }), options)
            },
            // dynamicComponent: ''
          }
        }
      }
    }
  },
  view: {

  },
  scope: {
    useCollectionDataSource() {
      return (field: any) => {
        const { collections = [] } = useCollectionManager();
        action.bound((data: any) => {
          field.dataSource = data.map(item => ({
            label: t(item.title),
            value: item.name
          }));
        })(collections);
      }
    }
  },
  components: {
    VariableComponent() {

    }
  },
  getter({ options, onChange }) {
    const { collections = [] } = useCollectionManager();
    const { nodes } = useFlowContext();
    const { config } = nodes.find(n => n.id === options.nodeId);
    const collection = collections.find(item => item.name === config.collection) ?? { fields: [] };

    const selectOptions = collection.fields
      .filter(field => BaseTypeSet.has(field.uiSchema.type))
      .map(field => ({
        label: field.uiSchema.title,
        value: field.name
      }));

    return (
      <Select value={options.path} placeholder="选择字段" onChange={path => onChange({ options: { ...options, path } })}>
        {selectOptions.map(option => (
          <Select.Option value={option.value}>{option.label}</Select.Option>
        ))}
      </Select>
    );
  }
};
