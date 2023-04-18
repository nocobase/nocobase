import React, { useMemo } from 'react';
import { Variable, useCompile } from '../../schema-component';
import { useUserVariable } from './hooks/useUserVariable';

type Props = {
  value: any;
  onChange: (value: any) => void;
  collectionName: string;
  renderSchemaComponent?: (props: any) => React.ReactNode;
  style: React.CSSProperties;
  schema: any;
  operator: any;
  children: any;
};

export const VariableInput = (props: Props) => {
  const { value, onChange, renderSchemaComponent, style, schema } = props;
  const compile = useCompile();
  const userVariable = useUserVariable({ schema, level: 1 });
  const scope = useMemo(() => {
    return [
      userVariable,
      compile({
        label: `{{t("Date variables")}}`,
        value: '$date',
        key: '$date',
        disabled: schema['x-component'] !== 'DatePicker',
        children: [
          {
            key: 'now',
            value: 'now',
            label: `{{t("Now")}}`,
          },
        ],
      }),
    ];
  }, []);

  return (
    <Variable.Input value={value} onChange={onChange} scope={scope} style={style}>
      {renderSchemaComponent?.({ value, onChange })}
    </Variable.Input>
  );
};
