import React from 'react';
import { useVariableOptions } from '../../../schema-settings/VariableInput/hooks/useVariableOptions';
import { Variable } from '../variable';

export function FilterDynamicComponent(props) {
  const { value, onChange, renderSchemaComponent } = props;
  const options = useVariableOptions();

  return (
    <Variable.Input value={value} onChange={onChange} scope={options}>
      {renderSchemaComponent()}
    </Variable.Input>
  );
}
