import React from 'react';

import { useFlowContext } from '../FlowContext';
import { useOperandContext } from '../calculators';
import CollectionFieldSelect from './CollectionFieldSelect';

export function NodeCollectionFieldValueGetter(props): React.ReactNode {
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
