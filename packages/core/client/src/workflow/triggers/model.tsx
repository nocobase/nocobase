import React from 'react';
import { Select } from 'antd';
import { action } from '@formily/reactive';
import { useForm } from '@formily/react';

import { useCollectionDataSource, useCollectionManager } from '../../collection-manager';
import { useCompile } from '../../schema-component';

import { useFlowContext } from '../WorkflowCanvas';
import { BaseTypeSet } from '../calculators';
import { collection, filter } from '../schemas/collection';

function useCollectionFieldsDataSource() {
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager();
  const { values } = useForm();
  const fields = getCollectionFields(values?.config?.collection);

  return (field: any) => {
    action.bound((data: any) => {
      field.dataSource = data
        .filter(field => (
          !field.hidden
          && (field.uiSchema ? !field.uiSchema['x-read-pretty'] : true)
        ))
        .map(field => ({
          label: compile(field.uiSchema?.title),
          value: field.name
        }));
    })(fields);
  };
}

export default {
  title: '数据表事件',
  type: 'model',
  fieldset: {
    'config.collection': collection,
    'config.mode': {
      type: 'number',
      title: '触发时机',
      name: 'config.mode',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        options: [
          { value: 1, label: '新增数据后' },
          { value: 2, label: '更新数据后' },
          { value: 3, label: '新增或更新数据后' },
          { value: 4, label: '删除数据后' }
        ]
      }
    },
    'config.changed': {
      type: 'array',
      name: 'changed',
      title: '发生变动的字段',
      description: '只有被选中的某个字段发生变动时才会触发。如果不选择，则表示任何字段变动时都会触发。新增或删除数据时，任意字段都被认为发生变动。',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        mode: 'multiple',
      },
      'x-reactions': [
        '{{useCollectionFieldsDataSource()}}'
      ]
    },
    'config.condition': {
      ...filter,
      name: 'config.condition',
      title: '满足条件'
    }
  },
  scope: {
    useCollectionDataSource,
    useCollectionFieldsDataSource
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
