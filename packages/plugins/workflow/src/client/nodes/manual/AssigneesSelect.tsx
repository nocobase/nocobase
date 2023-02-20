import { RemoteSelect } from '@nocobase/client';
import React from 'react';
import { VariableInput } from '../../components/VariableInput';
import { useWorkflowVariableOptions } from '../../variable';



export function AssigneesSelect({ multiple = false, value = [], onChange }) {
  const scope = useWorkflowVariableOptions();

  return (
    <VariableInput
      scope={scope}
      types={[{ type: 'reference', options: { collection: 'users' } }]}
      value={value[0]}
      onChange={(next) => {
        onChange([next]);
      }}
    >
      <RemoteSelect
        fieldNames={{
          label: 'nickname',
          value: 'id',
        }}
        service={{
          resource: 'users'
        }}
        value={value[0]}
        onChange={(v) => {
          onChange([v]);
        }}
      />
    </VariableInput>
  );
}
