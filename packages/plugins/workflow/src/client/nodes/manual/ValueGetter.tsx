import React from 'react';
import { useOperandContext } from '../../calculators';
import { useFlowContext } from '../../FlowContext';
import CollectionFieldSelect from '../../components/CollectionFieldSelect';



export function ValueGetter({ onChange }) {
  const { options } = useOperandContext();
  const { nodes } = useFlowContext();
  const { config } = nodes.find(n => n.id == options.nodeId);

  return (
    <CollectionFieldSelect
      fields={config.form.collection.fields}
      value={options?.path}
      onChange={(path) => {
        onChange(`{{$jobsMapByNodeId.${options.nodeId}.${path}}}`);
      }}
    />
  );
}
