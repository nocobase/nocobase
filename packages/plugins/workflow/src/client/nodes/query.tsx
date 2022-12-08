import React from 'react';

import { useCollectionDataSource, useCollectionManager, useCompile } from '@nocobase/client';

import { useFlowContext } from '../FlowContext';
import { useOperandContext, VariableComponent } from '../calculators';
import { collection, filter } from '../schemas/collection';
import CollectionFieldSelect from '../components/CollectionFieldSelect';
import { NAMESPACE } from '../locale';



export default {
  title: `{{t("Query record", { ns: "${NAMESPACE}" })}}`,
  type: 'query',
  group: 'collection',
  fieldset: {
    'config.collection': collection,
    'config.multiple': {
      type: 'boolean',
      title: `{{t("Multiple records", { ns: "${NAMESPACE}" })}}`,
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
  useFields() {
    return [];
  },
  getter(props) {
    const { onChange } = props;
    const { nodes } = useFlowContext();
    const { options } = useOperandContext();
    const { config } = nodes.find(n => n.id == options.nodeId);
    const value = options?.path;

    return (
      <CollectionFieldSelect
        collection={config.collection}
        value={value}
        onChange={(path) => {
          onChange(`{{$jobsMapByNodeId.${options.nodeId}.${path}}}`);
        }}
      />
    );
  }
};
