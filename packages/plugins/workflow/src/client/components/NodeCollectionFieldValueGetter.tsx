import React from 'react';

import { useFlowContext } from '../FlowContext';
import { useAvailableCollectionFields, useOperandContext } from '../variable';
import CollectionFieldSelect from './CollectionFieldSelect';

export function NodeCollectionFieldValueGetter({ onChange }): React.ReactElement {
  const { nodes } = useFlowContext();
  const { operand: { options } } = useOperandContext();
  const { config } = nodes.find(n => n.id == options.nodeId);

  return (
    <CollectionFieldSelect
      collection={config.collection}
      value={options?.path}
      onChange={(path) => {
        onChange(`{{$jobsMapByNodeId.${options.nodeId}.${path}}}`);
      }}
    />
  );
}

export function useNodeCollectionFieldValueGetter(node) {
  const { collection } = node.config;
  const fields = useAvailableCollectionFields(collection);

  if (!fields.length) {
    return null;
  }

  return NodeCollectionFieldValueGetter;
}
