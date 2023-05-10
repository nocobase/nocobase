import React from 'react';
import { Variable } from '../../schema-component';
import { useVariableOptions } from './Variables';

type Props = {
  value: any;
  onChange: (value: any) => void;
  renderSchemaComponent: () => React.ReactNode;
  collectionName: string;
};

export function FilterDynamicComponent(props: Props) {
  const { value, onChange, renderSchemaComponent, collectionName } = props;
  const scope = useVariableOptions(collectionName, ['o2m', 'm2m']);
  return (
    <Variable.Input value={value} onChange={onChange} scope={scope}>
      {renderSchemaComponent()}
    </Variable.Input>
  );
}
