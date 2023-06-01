import React, { useMemo } from 'react';
import { Variable, useCompile } from '../../schema-component';
import { useUserVariable } from './hooks/useUserVariable';

type Props = {
  value: any;
  onChange: (value: any) => void;
  collectionName: string;
  renderSchemaComponent?: (props: any) => any;
  schema: any;
  operator: any;
  children?: any;
  className?: string;
  style?: React.CSSProperties;
};

export const VariableInput = (props: Props) => {
  const { value, onChange, renderSchemaComponent: RenderSchemaComponent, style, schema, className } = props;
  const compile = useCompile();
  const userVariable = useUserVariable({ schema, maxDepth: 1 });
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
    <Variable.Input className={className} value={value} onChange={onChange} scope={scope} style={style}>
      <RenderSchemaComponent value={value} onChange={onChange} />
    </Variable.Input>
  );
};
