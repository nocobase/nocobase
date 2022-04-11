import React from 'react';
import { action } from '@formily/reactive';
import { t } from 'i18next';
import { Select } from 'antd';

import { useCollectionManager } from '../../collection-manager';
import { useFlowContext } from '../WorkflowCanvas';
import { BaseTypeSet } from '../calculators';

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
    // mode: {
    //   type: 'number',
    //   title: '触发时机',
    //   name: 'mode',
    // }
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
      <Select value={options.path} placeholder="选择字段" onChange={path => {
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
