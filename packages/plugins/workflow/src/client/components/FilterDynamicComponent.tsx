import React from 'react';

import { Variable } from '@nocobase/client';

import { useWorkflowVariableOptions } from '../variable';

export function FilterDynamicComponent({ value, onChange, renderSchemaComponent }) {
  const scope = useWorkflowVariableOptions();

  return (
    <Variable.Input value={value} onChange={onChange} scope={scope}>
      {renderSchemaComponent()}
    </Variable.Input>
  );
}
