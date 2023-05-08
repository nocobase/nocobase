import React from 'react';
import { useCompile } from '../../schema-component';
import { useFilterOptions } from '../../schema-component/antd/filter';
import { useValues } from '../../schema-component/antd/filter/useValues';
import { Variable } from '../../schema-component/antd/variable';

interface GetOptionsParams {
  schema: any;
  operator: string;
  maxDepth: number;
  count?: number;
}

const useOptions = (collectionName: string, { schema, operator, maxDepth, count = 1 }: GetOptionsParams) => {
  if (count > maxDepth) {
    return [];
  }

  const result = useFilterOptions(collectionName).map((option) => {
    if ((option.type !== 'belongsTo' && option.type !== 'hasOne') || !option.target) {
      return {
        key: option.name,
        value: option.name,
        label: option.title,
        // TODO: 现在是通过组件的名称来过滤能够被选择的选项，这样的坏处是不够精确，后续可以优化
        disabled: schema?.['x-component'] !== option.schema['x-component'],
      };
    }

    const children =
      useOptions(option.target, {
        schema,
        operator,
        maxDepth,
        count: count + 1,
      }) || [];

    return {
      key: option.name,
      value: option.name,
      label: option.title,
      children,
      disabled: children.every((child) => child.disabled),
    };
  });

  return result;
};

const useUserVariable = ({ schema, operator }) => {
  const options = useOptions('users', { schema, operator, maxDepth: 3 }) || [];

  return {
    label: `{{t("Current user")}}`,
    value: '$user',
    key: '$user',
    disabled: options.every((option) => option.disabled),
    children: options,
  };
};

const useVariableOptions = () => {
  const { operator, schema } = useValues();
  const userVariable = useUserVariable({ schema, operator });

  if (!operator || !schema) return [];

  return [userVariable];
};

export function FilterDynamicComponent(props) {
  const { value, onChange, renderSchemaComponent } = props;
  const options = useVariableOptions();
  const compile = useCompile();
  const scope = compile(options);

  return (
    <Variable.Input value={value} onChange={onChange} scope={scope}>
      {renderSchemaComponent()}
    </Variable.Input>
  );
}
