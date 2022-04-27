import React from 'react';
import { Select } from 'antd';

import { useCollectionDataSource, useCollectionManager, useCompile } from '../..';

import { useFlowContext } from '../WorkflowCanvas';
import { BaseTypeSet, VariableComponent } from '../calculators';
import { collection, filter } from '../schemas/collection';

export default {
  title: '查询数据',
  type: 'query',
  group: 'model',
  fieldset: {
    'config.collection': collection,
    'config.multiple': {
      type: 'boolean',
      title: '多条数据',
      name: 'config.multiple',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-component-props': {
        disabled: true
      }
    },
    'config.params': {
      type: 'object',
      name: 'config.params',
      title: '',
      'x-decorator': 'FormItem',
      properties: {
        filter
      }
    }
  },
  view: {

  },
  scope: {
    useCollectionDataSource
  },
  components: {
    VariableComponent
  },
  getter({ type, options, onChange }) {
    const compile = useCompile();
    const { collections = [] } = useCollectionManager();
    const { nodes } = useFlowContext();
    const { config } = nodes.find(n => n.id == options.nodeId);
    const collection = collections.find(item => item.name === config.collection) ?? { fields: [] };

    return (
      <Select value={options.path} placeholder="选择字段" onChange={path => {
        onChange({ type, options: { ...options, path } });
      }}>
        {collection.fields
          .filter(field => BaseTypeSet.has(field.uiSchema?.type))
          .map(field => (
          <Select.Option key={field.name} value={field.name}>{compile(field.uiSchema.title)}</Select.Option>
        ))}
      </Select>
    );
  }
};
