import { useCompile } from '@nocobase/client';
import React from 'react';
import { Variable } from '../variable';

const useVariableTypes = () => {
  return [
    {
      title: `{{t("System variables")}}`,
      value: '$system',
      options: [
        {
          key: 'now',
          value: 'now',
          label: `{{t("Current time")}}`,
        },
      ],
    },
  ];
};

const useVariableOptions = () => {
  const compile = useCompile();
  const options = useVariableTypes().map((item) => {
    return {
      label: compile(item.title),
      value: item.value,
      key: item.value,
      children: compile(item.options),
      disabled: item.options && !item.options.length,
    };
  });
  return options;
};

export function FilterDynamicComponent(props) {
  const { value, onChange, renderSchemaComponent } = props;
  const scope = useVariableOptions();
  return (
    <Variable.Input value={value} onChange={onChange} scope={scope}>
      {renderSchemaComponent()}
    </Variable.Input>
  );
}
