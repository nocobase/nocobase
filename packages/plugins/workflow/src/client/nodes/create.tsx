import { Select } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionDataSource, useCollectionManager, useCompile } from '@nocobase/client';
import { BaseTypeSet, CollectionFieldset } from '../calculators';
import { collection, values } from '../schemas/collection';
import { useFlowContext } from '../WorkflowCanvas';
import CollectionFieldSelect from '../components/CollectionFieldSelect';



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
  getter(props) {
    const { type, options, onChange } = props;
    const { nodes } = useFlowContext();
    const { config } = nodes.find(n => n.id == options.nodeId);
    const value = options?.path;

    return (
      <CollectionFieldSelect
        collection={config.collection}
        value={value}
        onChange={(path) => {
          onChange({ type, options: { ...options, path } });
        }}
      />
    );
  }
};
