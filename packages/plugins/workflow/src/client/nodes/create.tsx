import { Select } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionDataSource, useCollectionManager, useCompile } from '@nocobase/client';
import { BaseTypeSet, CollectionFieldset } from '../calculators';
import { collection, values } from '../schemas/collection';
import { useFlowContext } from '../WorkflowCanvas';



export default {
  title: '{{t("Create record")}}',
  type: 'create',
  group: 'collection',
  fieldset: {
    'config.collection': {
      ...collection,
      name: 'config.collection'
    },
    // multiple: {
    //   type: 'boolean',
    //   title: '多条数据',
    //   name: 'multiple',
    //   'x-decorator': 'FormItem',
    //   'x-component': 'Checkbox',
    //   'x-component-props': {
    //     disabled: true
    //   }
    // },
    'config.params.values': values
  },
  view: {

  },
  scope: {
    useCollectionDataSource
  },
  components: {
    CollectionFieldset
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
          .filter(field => BaseTypeSet.has(field.uiSchema.type))
          .map(field => (
          <Select.Option key={field.name} value={field.name}>{compile(field.uiSchema.title)}</Select.Option>
        ))}
      </Select>
    );
  }
};
