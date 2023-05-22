import React from 'react';
import { useCollection } from '../../../collection-manager';
import { useVariableOptions } from '../../../schema-settings/VariableInput/hooks/useVariableOptions';
import { Variable } from '../variable';

export function FilterDynamicComponent(props) {
  const { value, onChange, renderSchemaComponent, form, collectionField } = props;
  const options = useVariableOptions({ blockForm: form, collectionField });

  return (
    <Variable.Input value={value} onChange={onChange} scope={options}>
      {renderSchemaComponent()}
    </Variable.Input>
  );
}
