import React from 'react';
import { Variable } from '../../schema-component';
import { useVariableOptions } from './Variables';

export function FilterDynamicComponent(props) {
  const { value, onChange, renderSchemaComponent, collectionName } = props;
  const scope = useVariableOptions(collectionName);
  return (
    <Variable.Input value={value} onChange={onChange} scope={scope}>
      {renderSchemaComponent()}
    </Variable.Input>
  );
}
