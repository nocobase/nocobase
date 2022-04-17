import React from 'react';
import { Select } from 'antd';

import { useCollectionDataSource, useCollectionManager } from '../../collection-manager';
import { useCompile } from '../../schema-component';

import { useFlowContext } from '../WorkflowCanvas';
import { BaseTypeSet } from '../calculators';
import { collection, filter } from '../schemas/collection';

export default {
  title: '数据表事件',
  type: 'model',
  fieldset: {
    collection,
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
      ...filter,
      title: '满足条件'
    }
  },
  scope: {
    useCollectionDataSource
  },
  getter({ type, options, onChange }) {
    const compile = useCompile();
    const { collections = [] } = useCollectionManager();
    const { workflow } = useFlowContext();
    const collection = collections.find(item => item.name === workflow.config.collection) ?? { fields: [] };

    return (
      <Select
        placeholder="选择字段"
        value={options?.path?.replace(/^data\./, '')}
        onChange={(path) => {
          onChange({ type, options: { ...options, path: `data.${path}` } });
        }}
      >
        {collection.fields
          .filter(field => BaseTypeSet.has(field?.uiSchema?.type))
          .map(field => (
          <Select.Option key={field.name} value={field.name}>{compile(field.uiSchema.title)}</Select.Option>
        ))}
      </Select>
    );
  }
};
