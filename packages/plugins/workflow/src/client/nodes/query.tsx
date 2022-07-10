import React from 'react';

import { useCollectionDataSource, useCollectionManager, useCompile } from '@nocobase/client';

import { useFlowContext } from '../WorkflowCanvas';
import { VariableComponent } from '../calculators';
import { collection, filter } from '../schemas/collection';
import CollectionFieldSelect from '../components/CollectionFieldSelect';



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
