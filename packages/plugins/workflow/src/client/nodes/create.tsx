import React from 'react';
import { useCollectionDataSource } from '@nocobase/client';

import { collection, values } from '../schemas/collection';
import { useFlowContext } from '../FlowContext';
import CollectionFieldSelect from '../components/CollectionFieldSelect';
import CollectionFieldset from '../components/CollectionFieldset';
import { NAMESPACE } from '../locale';



export default {
  title: `{{t("Create record", { ns: "${NAMESPACE}" })}}`,
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
