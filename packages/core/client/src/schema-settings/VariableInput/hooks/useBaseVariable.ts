import { useMemo } from 'react';
import { CollectionFieldOptions } from '../../../collection-manager';
import { useCompile, useGetFilterOptions } from '../../../schema-component';
import { FieldOption, Option } from '../type';

interface GetOptionsParams {
  collectionField: CollectionFieldOptions;
  uiSchema: any;
  depth: number;
  maxDepth?: number;
  loadChildren?: (option: Option) => Promise<void>;
  compile: (value: string) => any;
}

interface BaseProps {
  // 当前字段
  collectionField: CollectionFieldOptions;
  /** 当前字段的 `uiSchema`，和 `collectionField.uiSchema` 不同，该值也包含操作符中 schema（参见 useValues） */
  uiSchema: any;
  maxDepth?: number;
  name: string;
  title: string;
  /**
   * 变量所对应的 collectionName，例如：$user 对应的 collectionName 是 users
   */
  collectionName: string;
  /**
   * 对每一个关系字段的 fields 进行过滤
   * @param fields
   * @param option
   */
  returnFields?(fields: FieldOption[], option: Option): FieldOption[];
}

const getChildren = (
  options: FieldOption[],
  { collectionField, uiSchema, depth, maxDepth, loadChildren, compile }: GetOptionsParams,
): Option[] => {
  const result = options
    .map((option): Option => {
      if (!option.target) {
        return {
          key: option.name,
          value: option.name,
          label: compile(option.title),
          disabled: isDisabled(option, { collectionField, uiSchema }),
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
        disabled: isDisabled(option, { collectionField, uiSchema }),
        loadChildren,
      };
    })
    .filter(Boolean);

  return result;
};

export const useBaseVariable = ({
  collectionField,
  uiSchema,
  maxDepth = 3,
  name,
  title,
  collectionName,
  returnFields = (fields) => fields,
}: BaseProps) => {
  const compile = useCompile();
  const getFilterOptions = useGetFilterOptions();

  const loadChildren = (option: Option): Promise<void> => {
    if (!option.field?.target) {
      return new Promise((resolve) => {
        resolve(void 0);
      });
    }

    const target = option.field.target;
    return new Promise((resolve) => {
      setTimeout(() => {
        const children =
          getChildren(returnFields(getFilterOptions(target), option), {
            collectionField,
            uiSchema,
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
      label: title,
      value: name,
      key: name,
      isLeaf: false,
      field: {
        target: collectionName,
      },
      depth: 0,
      loadChildren,
      children: [],
    } as Option;
  }, [uiSchema?.['x-component']]);

  return result;
};

function isDisabled(
  option: FieldOption,
  deps: {
    collectionField: CollectionFieldOptions;
    uiSchema: any;
  },
) {
  const { collectionField, uiSchema } = deps;

  if (!uiSchema) {
    return false;
  }

  // json 类型的字段，允许设置任意类型的值
  if (collectionField.interface === 'json') {
    return false;
  }

  if (!collectionField.target && ['hasMany', 'belongsToMany'].includes(option.type)) {
    return true;
  }

  if (!collectionField.target && ['hasOne', 'belongsTo'].includes(option.type)) {
    return false;
  }

  if (['hasOne', 'belongsTo'].includes(collectionField.type) && ['hasMany', 'belongsToMany'].includes(option.type)) {
    return true;
  }

  if (['hasOne', 'belongsTo'].includes(collectionField.type) && ['hasOne', 'belongsTo'].includes(option.type)) {
    return false;
  }

  // 数字可以赋值给字符串
  if (uiSchema.type === 'string' && option.schema?.type === 'number') {
    return false;
  }

  if (uiSchema?.['x-component'] !== option.schema?.['x-component']) {
    return true;
  }

  return false;
}
