import { ISchema } from '@formily/json-schema';
import React, { useContext, useMemo } from 'react';
import { CollectionFieldOptions } from '../../../collection-manager';
import { useCompile, useGetFilterOptions } from '../../../schema-component';
import { FieldOption, Option } from '../type';

export interface IsDisabledParams {
  option: FieldOption;
  collectionField: CollectionFieldOptions;
  uiSchema: ISchema;
}

interface GetOptionsParams {
  collectionField: CollectionFieldOptions;
  uiSchema: any;
  depth: number;
  maxDepth?: number;
  /**
   * 不需要禁用选项，一般会在表达式中使用
   */
  noDisabled?: boolean;
  loadChildren?: (option: Option) => Promise<void>;
  compile: (value: string) => any;
  isDisabled?: (params: IsDisabledParams) => boolean;
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
   * 不需要禁用选项，一般会在表达式中使用
   */
  noDisabled?: boolean;
  /**
   * 对每一个关系字段的 fields 进行过滤
   * @param fields
   * @param option
   */
  returnFields?(fields: FieldOption[], option: Option): FieldOption[];
}

interface BaseVariableProviderProps {
  /**
   * 每一个选项都会调用该方法，返回 true 表示禁用该选项，当 `noDisabled` 为 true 时，该方法不会被调用
   */
  isDisabled?: (params: IsDisabledParams) => boolean;
  children?: React.ReactNode;
}

const BaseVariableContext = React.createContext<Omit<BaseVariableProviderProps, 'children'>>(null);

export const BaseVariableProvider = (props: BaseVariableProviderProps) => {
  return <BaseVariableContext.Provider value={props}>{props.children}</BaseVariableContext.Provider>;
};

const getChildren = (
  options: FieldOption[],
  { collectionField, uiSchema, depth, maxDepth, noDisabled, loadChildren, compile, isDisabled }: GetOptionsParams,
): Option[] => {
  const result = options
    .map((option): Option => {
      if (!option.target) {
        return {
          key: option.name,
          value: option.name,
          label: compile(option.title),
          disabled: noDisabled ? false : isDisabled({ option, collectionField, uiSchema }),
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
        disabled: noDisabled ? false : isDisabled({ option, collectionField, uiSchema }),
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
  noDisabled,
  returnFields = (fields) => fields,
}: BaseProps) => {
  const compile = useCompile();
  const getFilterOptions = useGetFilterOptions();
  const { isDisabled } = useContext(BaseVariableContext) || {};

  const loadChildren = (option: Option): Promise<void> => {
    if (!option.field?.target) {
      return Promise.resolve(void 0);
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
            noDisabled,
            loadChildren,
            compile,
            isDisabled: isDisabled || isDisabledDefault,
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

/**
 * 默认的禁用选项方法，可以通过 `BaseVariableProvider` 覆盖
 * @param params
 * @returns
 */
function isDisabledDefault(params: IsDisabledParams) {
  const { option, collectionField, uiSchema } = params;

  if (!uiSchema) {
    return false;
  }

  // json 类型的字段，允许设置任意类型的值
  if (collectionField.interface === 'json') {
    return false;
  }

  // 普通字段不允许设置多个值
  if (!collectionField.target && ['hasMany', 'belongsToMany'].includes(option.type)) {
    return true;
  }
  if (!collectionField.target && ['hasOne', 'belongsTo'].includes(option.type)) {
    return false;
  }

  // 对一字段不允许设置多个值
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
