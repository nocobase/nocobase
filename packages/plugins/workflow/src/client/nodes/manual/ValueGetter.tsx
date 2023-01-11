import React from 'react';
import { useOperandContext } from '../../variable';
import { useFlowContext } from '../../FlowContext';
import CollectionFieldSelect from '../../components/CollectionFieldSelect';



export function ValueGetter({ onChange }) {
  const { operand: { options } } = useOperandContext();
  const { nodes } = useFlowContext();
  const { config } = nodes.find(n => n.id == options.nodeId);

  return (
    <CollectionFieldSelect
      fields={config.schema.collection.fields}
      value={options?.path}
      onChange={(path) => {
        onChange(`{{$jobsMapByNodeId.${options.nodeId}.${path}}}`);
      }}
    />
  );
}
