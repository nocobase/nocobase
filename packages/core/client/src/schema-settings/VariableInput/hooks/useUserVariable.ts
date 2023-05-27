import { observable } from '@formily/reactive';
import { error } from '@nocobase/utils/client';
import { useMemo } from 'react';
import { useCompile, useGetFilterOptions } from '../../../schema-component';
import { FieldOption, Option } from '../type';

interface GetOptionsParams {
  schema: any;
  operator?: string;
  maxDepth: number;
  count?: number;
  getFilterOptions: (collectionName: string) => any[];
  loadChildren?: (option: Option) => Promise<void>;
}

const getChildren = (
  options: FieldOption[],
  { schema, operator, maxDepth, count = 1, getFilterOptions, loadChildren }: GetOptionsParams,
): Option[] => {
  if (count > maxDepth) {
    return [];
  }

  const result = options.map((option): Option => {
    if (!option.target) {
      return {
        key: option.name,
        value: option.name,
        label: option.title,
        // TODO: 现在是通过组件的名称来过滤能够被选择的选项，这样的坏处是不够精确，后续可以优化
        disabled: schema?.['x-component'] !== option.schema?.['x-component'],
        isLeaf: true,
      };
    }

    const children =
      getChildren(getFilterOptions(option.target), {
        schema,
        operator,
        maxDepth,
        count: count + 1,
        getFilterOptions,
        loadChildren,
      }) || [];

    return {
      key: option.name,
      value: option.name,
      label: option.title,
      children,
      isLeaf: false,
      field: option,
      loadChildren,
    };
  });

  return result;
};

export const useUserVariable = ({ operator, schema, level }: { operator?: any; schema: any; level?: number }) => {
  const compile = useCompile();
  const getFilterOptions = useGetFilterOptions();

  const loadChildren = (option: Option): Promise<void> => {
    if (!option.field?.target) {
      return new Promise((resolve) => {
        error('Must be set field target');
        resolve(void 0);
      });
    }

    const collectionName = option.field.target;
    return new Promise((resolve) => {
      setTimeout(() => {
        const children =
          getChildren(getFilterOptions(collectionName), {
            schema,
            operator,
            maxDepth: level || 1,
            getFilterOptions,
            loadChildren,
          }) || [];

        option.children = compile(children);
        resolve(void 0);

        // 延迟 5 毫秒，防止阻塞主线程，导致 UI 卡顿
      }, 5);
    });
  };

  const result = useMemo(() => {
    return compile({
      label: `{{t("Current user")}}`,
      value: '$user',
      key: '$user',
      children: [],
      isLeaf: false,
      field: {
        target: 'users',
      },
      loadChildren,
    } as Option);
  }, [schema, operator]);

  // 必须使用 observable 包一下，使其变成响应式对象，不然 children 加载后不会更新 UI
  return observable(result);
};
