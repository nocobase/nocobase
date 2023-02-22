import React from 'react';
import { VariableInput } from './component/VariableInput';
import { useVariableOptions } from './Variables';

export function FilterDynamicComponent(props) {
  const { value, onChange, renderSchemaComponent, collectionName } = props;
  const scope = useVariableOptions(collectionName);
  return (
    <VariableInput value={value} onChange={onChange} scope={scope}>
      {renderSchemaComponent()}
    </VariableInput>
  );
}
