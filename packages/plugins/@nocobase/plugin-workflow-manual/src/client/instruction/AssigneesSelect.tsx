import React from 'react';
import { RemoteSelect, Variable } from '@nocobase/client';
import { useWorkflowVariableOptions } from '@nocobase/plugin-workflow/client';

function isUserKeyField(field) {
  if (field.isForeignKey) {
    return field.target === 'users';
  }
  return field.collectionName === 'users' && field.name === 'id';
}

export function AssigneesSelect({ multiple = false, value = [], onChange }) {
  const scope = useWorkflowVariableOptions({ types: [isUserKeyField] });

  return (
    <Variable.Input
      scope={scope}
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
          resource: 'users',
        }}
        manual={false}
        value={value[0]}
        onChange={(v) => {
          onChange(v != null ? [v] : []);
        }}
      />
    </Variable.Input>
  );
}
