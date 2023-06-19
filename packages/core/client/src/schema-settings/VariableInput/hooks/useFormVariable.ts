import { useMemo } from 'react';
import { useCompile, useGetFilterOptions } from '../../../schema-component';
import { Schema } from '@formily/react';
import { options } from '../../../collection-manager/Configuration/interfaces';
import { FieldOption, Option } from '../type';

interface GetOptionsParams {
  depth: number;
  operator?: string;
  maxDepth: number;
  count?: number;
  loadChildren?: (option: Option) => Promise<void>;
  getFilterOptions?: (collectionName: string) => any[];
  compile: (value: string) => any;
}

const getChildren = (
  options: FieldOption[],
  { depth, maxDepth, loadChildren, compile }: GetOptionsParams,
): Option[] => {
  const result = options
    .map((option): Option => {
      if (!option.target) {
        return {
          key: option.name,
          value: option.name,
          label: compile(option.title),
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
export const useFormVariable = ({
  blockForm,
  rootCollection,
  operator,
  schema,
  level,
}: {
  blockForm?: any;
  rootCollection: string;
  operator?: any;
  schema: Schema;
  level?: number;
}) => {
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
      label: `{{t("Current form")}}`,
      value: '$form',
      key: '$form',
      children: [],
      isLeaf: false,
      field: {
        target: rootCollection,
      },
      depth: 0,
      loadChildren,
    };
  }, [rootCollection]);
  return result;
};
