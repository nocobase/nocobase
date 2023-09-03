import React from 'react';
import { useCompile } from '../../schema-component';
import { useGetFilterOptions } from '../../schema-component/antd/filter';
import { useValues } from '../../schema-component/antd/filter/useValues';
import { Variable } from '../../schema-component/antd/variable';

interface GetOptionsParams {
  schema: any;
  operator: string;
  maxDepth: number;
  getFilterOptions: (collectionName: string) => any[];
  count?: number;
}

const getOptions = (
  collectionName: string,
  { schema, operator, maxDepth, getFilterOptions, count = 1 }: GetOptionsParams,
) => {
  if (count > maxDepth) {
    return [];
  }

  const result = getFilterOptions(collectionName).map((option) => {
    if ((option.type !== 'belongsTo' && option.type !== 'hasOne') || !option.target) {
      return {
        key: option.name,
        value: option.name,
        label: option.title,
        // TODO: 现在是通过组件的名称来过滤能够被选择的选项，这样的坏处是不够精确，后续可以优化
        disabled: schema?.['x-component'] !== option.schema?.['x-component'],
      };
    }

    const children =
      getOptions(option.target, {
        schema,
        operator,
        maxDepth,
        count: count + 1,
        getFilterOptions,
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
  const getFilterOptions = useGetFilterOptions();
  const options = getOptions('users', { schema, operator, maxDepth: 1, getFilterOptions }) || [];

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
