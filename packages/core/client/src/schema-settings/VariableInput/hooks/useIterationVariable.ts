import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile, useGetFilterOptions } from '../../../schema-component';
import { FieldOption, Option } from '../type';

interface GetOptionsParams {
  depth: number;
  operator?: string;
  maxDepth: number;
  count?: number;
  loadChildren?: (option: Option) => Promise<void>;
  getFilterOptions?: (collectionName: string) => any[];
  compile: (value: string) => any;
  schema: any;
}

const getChildren = (
  options: FieldOption[],
  { depth, maxDepth, loadChildren, compile, schema }: GetOptionsParams,
): Option[] => {
  const result = options
    .map((option): Option => {
      if (!option.target) {
        return {
          key: option.name,
          value: option.name,
          label: compile(option.title),
          depth,
          // TODO: 现在是通过组件的名称来过滤能够被选择的选项，这样的坏处是不够精确，后续可以优化
          disabled: schema && schema?.['x-component'] !== option.schema?.['x-component'],
        };
      }

      if (depth >= maxDepth) {
        return null;
      }

      return {
        key: option.name,
        value: option.name,
        label: compile(option.title),
        children: [],
        isLeaf: false,
        field: option,
        depth,
        loadChildren,
      };
    })
    .filter(Boolean);
  return result;
};
export const useIterationVariable = ({
  blockForm,
  currentCollection,
  operator,
  schema,
  level,
  rootCollection,
}: {
  blockForm?: any;
  currentCollection: string;
  rootCollection: string;
  operator?: any;
  schema?: any;
  level?: number;
}) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const getFilterOptions = useGetFilterOptions();
  const loadChildren = (option: any): Promise<void> => {
    if (!option.field?.target) {
      return new Promise((resolve) => {
        resolve(void 0);
      });
    }

    const collectionName = option.field.target;
    const fields = getFilterOptions(collectionName);
    const allowFields =
      option.depth === 0
        ? fields.filter((field) => {
            return Object.keys(blockForm.fields).some((name) => name.includes(`.${field.name}`));
          })
        : fields;
    return new Promise((resolve) => {
      setTimeout(() => {
        const children =
          getChildren(allowFields, {
            depth: option.depth + 1,
            maxDepth: 4,
            loadChildren,
            compile,
            schema,
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
  const label = t('Current object');
  const result = useMemo(() => {
    return (
      blockForm &&
      currentCollection !== rootCollection && {
        label: label,
        value: '$iteration',
        key: '$iteration',
        isLeaf: false,
        field: {
          target: currentCollection,
        },
        depth: 0,
        loadChildren,
      }
    );
  }, [currentCollection]);
  return result;
};
