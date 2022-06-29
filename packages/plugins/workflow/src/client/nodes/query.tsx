import React from 'react';
import { Select } from 'antd';
import { useTranslation } from 'react-i18next';

import { useCollectionDataSource, useCollectionManager, useCompile } from '@nocobase/client';

import { useFlowContext } from '../WorkflowCanvas';
import { BaseTypeSet, VariableComponent } from '../calculators';
import { collection, filter } from '../schemas/collection';



export default {
  title: '{{t("Query record")}}',
  type: 'query',
  group: 'collection',
  fieldset: {
    'config.collection': collection,
    'config.multiple': {
      type: 'boolean',
      title: '{{t("Multiple records")}}',
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
    const { t } = useTranslation();
    const compile = useCompile();
    const { collections = [] } = useCollectionManager();
    const { nodes } = useFlowContext();
    const { config } = nodes.find(n => n.id == options.nodeId);
    const collection = collections.find(item => item.name === config.collection) ?? { fields: [] };

    return (
      <Select value={options.path} placeholder={t('Fields')} onChange={path => {
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
