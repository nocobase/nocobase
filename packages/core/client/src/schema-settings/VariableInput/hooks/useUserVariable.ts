import { useMemo } from 'react';
import { useGetFilterOptions } from '../../../schema-component';

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

// 缓存结果，避免重复计算
// TODO: 由于结果缓存到内存中，所以当用户更改了用户的数据时需要刷新页面才能生效，后续优化的版本在 #1932 中进行
let cacheResult = null;

export const useUserVariable = ({ operator, schema, level }: { operator?: any; schema: any; level?: number }) => {
  const getFilterOptions = useGetFilterOptions();

  return useMemo(() => {
    if (cacheResult) return cacheResult;
    if (!schema) return {};

    let children = [];
    if (schema) {
      children =
        getChildren(getFilterOptions('users'), { schema, operator, maxDepth: level || 3, getFilterOptions }) || [];
    }

    cacheResult = {
      label: `{{t("Current user")}}`,
      value: '$user',
      key: '$user',
      disabled: children.every((option) => option.disabled),
      children: children,
    };

    return cacheResult;
  }, [schema]);
};
