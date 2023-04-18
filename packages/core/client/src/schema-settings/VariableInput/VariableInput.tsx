import React from 'react';
import { Variable } from '../../schema-component';
import { useVariableOptions } from '../LinkageRules/Variables';

type Props = {
  value: any;
  onChange: (value: any) => void;
  collectionName: string;
  renderSchemaComponent?: (props: any) => React.ReactNode;
  style: React.CSSProperties;
  children: any;
};

export const VariableInput = (props: Props) => {
  const { value, onChange, collectionName, renderSchemaComponent, style } = props;

  const scope = useVariableOptions(collectionName);
  return (
    <Variable.Input value={value} onChange={onChange} scope={scope} style={style}>
      {renderSchemaComponent?.({ value, onChange })}
    </Variable.Input>
  );
};
