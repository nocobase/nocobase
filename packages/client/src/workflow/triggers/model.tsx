import React from 'react';
import { action } from '@formily/reactive';
import { t } from 'i18next';
import { Select } from 'antd';

import { useCollectionManager } from '../../collection-manager';
import { useFlowContext } from '../WorkflowCanvas';
import { BaseTypeSet } from '../calculators';
import { useForm } from '@formily/react';
import { useCollectionFilterOptions } from '../../collection-manager/action-hooks';

export default {
  title: '数据表事件',
  type: 'model',
  fieldset: {
    collection: {
      type: 'string',
      title: '数据表',
      name: 'collection',
      required: true,
      'x-reactions': ['{{useAsyncDataSource()}}'],
      'x-decorator': 'FormItem',
      'x-component': 'Select',
    },
    mode: {
      type: 'number',
      title: '触发时机',
      name: 'mode',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        options: [
          { value: 1, label: '新增数据' },
          { value: 2, label: '更新数据' },
          { value: 3, label: '新增或更新数据' },
          { value: 4, label: '删除数据' }
        ]
      }
    },
    filter: {
      type: 'object',
      title: '满足条件',
      description: 'not supported by server yet',
      name: 'filter',
      'x-decorator': 'FormItem',
      'x-component': 'Filter',
      'x-component-props': {
        useProps() {
          const { values } = useForm();
          const options = useCollectionFilterOptions(values.collection);
          return { options };
        }
      }
    }
  },
  scope: {
    useAsyncDataSource() {
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
  getter({ type, options, onChange }) {
    const { collections = [] } = useCollectionManager();
    const { workflow } = useFlowContext();
    const collection = collections.find(item => item.name === workflow.config.collection) ?? { fields: [] };

    return (
      <Select value={options?.path.replace(/^data\./, '')} placeholder="选择字段" onChange={path => {
        onChange({ type, options: { ...options, path: `data.${path}` } });
      }}>
        {collection.fields
          .filter(field => BaseTypeSet.has(field.uiSchema.type))
          .map(field => (
          <Select.Option key={field.name} value={field.name}>{t(field.uiSchema.title)}</Select.Option>
        ))}
      </Select>
    );
  }
};
