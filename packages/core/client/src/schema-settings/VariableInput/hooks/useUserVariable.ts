import { error } from '@nocobase/utils/client';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile, useGetFilterOptions } from '../../../schema-component';
import { FieldOption, Option } from '../type';

interface GetOptionsParams {
  schema: any;
  depth: number;
  maxDepth?: number;
  loadChildren?: (option: Option) => Promise<void>;
  compile: (value: string) => any;
}

const getChildren = (
  options: FieldOption[],
  { schema, depth, maxDepth, loadChildren, compile }: GetOptionsParams,
): Option[] => {
  const result = options
    .map((option): Option => {
      if (!option.target) {
        return {
          key: option.name,
          value: option.name,
          label: compile(option.title),
          // TODO: 现在是通过组件的名称来过滤能够被选择的选项，这样的坏处是不够精确，后续可以优化
          disabled: schema?.['x-component'] !== option.schema?.['x-component'],
          isLeaf: true,
          depth,
        };
      }

      if (depth >= maxDepth) {
        return null;
      }

      return {
        key: option.name,
        value: option.name,
        label: compile(option.title),
        isLeaf: false,
        field: option,
        depth,
        loadChildren,
      };
    })
    .filter(Boolean);

  return result;
};

export const useUserVariable = ({ schema, maxDepth = 3 }: { schema: any; maxDepth?: number }) => {
  const { t } = useTranslation();
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
            depth: option.depth + 1,
            maxDepth,
            loadChildren,
            compile,
          }) || [];

        if (children.length === 0) {
          option.disabled = true;
          resolve();
          return;
        }
        option.children = children;
        resolve();

        // 延迟 5 毫秒，防止阻塞主线程，导致 UI 卡顿
      }, 5);
    });
  };

  const result = useMemo(() => {
    return {
      label: t('Current user'),
      value: '$user',
      key: '$user',
      isLeaf: false,
      field: {
        target: 'users',
      },
      depth: 0,
      loadChildren,
    } as Option;
  }, [schema?.['x-component']]);

  return result;
};
