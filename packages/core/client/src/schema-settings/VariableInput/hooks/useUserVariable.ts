import { useMemo } from 'react';
import { useCompile, useGetFilterOptions } from '../../../schema-component';

interface GetOptionsParams {
  schema: any;
  operator?: string;
  maxDepth: number;
  count?: number;
  getFilterOptions: (collectionName: string) => any[];
}

const getChildren = (options: any[], { schema, operator, maxDepth, count = 1, getFilterOptions }: GetOptionsParams) => {
  if (count > maxDepth) {
    return [];
  }

  const result = options.map((option) => {
    if (!option.target) {
      return {
        key: option.name,
        value: option.name,
        label: option.title,
        // TODO: 现在是通过组件的名称来过滤能够被选择的选项，这样的坏处是不够精确，后续可以优化
        disabled: schema?.['x-component'] !== option.schema?.['x-component'],
      };
    }

    const children =
      getChildren(getFilterOptions(option.target), {
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

export const useUserVariable = ({ operator, schema, level }: { operator?: any; schema: any; level?: number }) => {
  const compile = useCompile();
  const getFilterOptions = useGetFilterOptions();

  const children = useMemo(
    () => getChildren(getFilterOptions('users'), { schema, operator, maxDepth: level || 3, getFilterOptions }) || [],
    [operator, schema],
  );

  return useMemo(() => {
    return compile({
      label: `{{t("Current user")}}`,
      value: '$user',
      key: '$user',
      disabled: children.every((option) => option.disabled),
      children: children,
    });
  }, [children]);
};
