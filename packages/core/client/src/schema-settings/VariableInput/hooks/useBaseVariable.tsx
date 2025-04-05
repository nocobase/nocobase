/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, Schema } from '@formily/json-schema';
import { Tooltip } from 'antd';
import React, { useContext, useMemo } from 'react';
import { CollectionFieldOptions_deprecated } from '../../../collection-manager';
import { useCollectionManager } from '../../../data-source/collection/CollectionManagerProvider';
import { useCompile, useGetFilterOptions } from '../../../schema-component';
import { isSpecialCaseField } from '../../../schema-component/antd/form-item/hooks/useSpecialCase';
import { FieldOption, Option } from '../type';

export interface IsDisabledParams {
  option: FieldOption;
  collectionField: CollectionFieldOptions_deprecated;
  uiSchema: ISchema;
  /** 消费变量值的字段 */
  targetFieldSchema: Schema;
  getCollectionField: (name: string) => CollectionFieldOptions_deprecated;
}

interface GetOptionsParams {
  collectionField: CollectionFieldOptions_deprecated;
  uiSchema: any;
  depth: number;
  /** 消费变量值的字段 */
  targetFieldSchema?: Schema;
  maxDepth?: number;
  /**
   * 不需要禁用选项，一般会在表达式中使用
   */
  noDisabled?: boolean;
  /**
   * 加载选项的 children
   * @param option 需要加载 children 的选项
   * @param activeKey 当前选项所对应的 key
   * @param variablePath 变量路径数组，如 ['$user', 'nickname']
   * @returns
   */
  loadChildren?: (option: Option, activeKey?: string, variablePath?: string[]) => Promise<void>;
  compile: (value: string) => any;
  isDisabled?: (params: IsDisabledParams) => boolean;
  getCollectionField?: (name: string) => CollectionFieldOptions_deprecated;
  /**
   * 如果为 true 则表示该变量已被弃用
   */
  deprecated?: boolean;
}

interface BaseProps {
  // 当前字段
  collectionField?: CollectionFieldOptions_deprecated;
  /** 当前字段的 `uiSchema`，和 `collectionField.uiSchema` 不同，该值也包含操作符中 schema（参见 useValues） */
  uiSchema?: any;
  /** 消费变量值的字段 */
  targetFieldSchema?: Schema;
  maxDepth?: number;
  name: string;
  title: string;
  /**
   * 变量所对应的 collectionName，例如：$user 对应的 collectionName 是 users
   */
  collectionName?: string;
  /**
   * 不需要禁用选项，一般会在表达式中使用
   */
  noDisabled?: boolean;
  /**
   * 不需要二级菜单
   */
  noChildren?: boolean;
  /**
   * 对每一个关系字段的 fields 进行过滤
   * @param fields
   * @param option
   */
  returnFields?(fields: FieldOption[], option: Option): FieldOption[];
  dataSource?: string;
  /**
   * 如果为 true 则表示该变量已被弃用
   */
  deprecated?: boolean;
  tooltip?: string;
  /**支持的操作符 */
  operators?: any[];
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
  {
    collectionField,
    uiSchema,
    depth,
    maxDepth,
    noDisabled,
    loadChildren,
    compile,
    isDisabled,
    targetFieldSchema,
    getCollectionField,
    deprecated,
  }: GetOptionsParams,
): Option[] => {
  const result = options
    .map((option): Option => {
      if (!option.target || option.target === 'chinaRegions') {
        return {
          key: option.name,
          value: option.name,
          label: compile(option.title),
          disabled:
            deprecated ||
            (noDisabled
              ? false
              : isDisabled({ option, collectionField, uiSchema, targetFieldSchema, getCollectionField })),
          isLeaf: true,
          depth,
          operators: option?.operators,
          schema: option?.schema,
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
        disabled:
          deprecated ||
          (noDisabled
            ? false
            : isDisabled({ option, collectionField, uiSchema, targetFieldSchema, getCollectionField })),
        loadChildren,
      };
    })
    .filter(Boolean);

  return result;
};

export const getLabelWithTooltip = (title: string, tooltip?: string) => {
  return tooltip ? (
    <Tooltip placement="left" title={tooltip} zIndex={9999}>
      <span
        style={{
          position: 'relative',
          display: 'inline-block',
          marginLeft: -14,
          paddingLeft: 14,
          marginRight: -80,
          paddingRight: 80,
          zIndex: 1,
        }}
      >
        {title}
      </span>
    </Tooltip>
  ) : (
    title
  );
};

export const useBaseVariable = ({
  collectionField,
  uiSchema,
  targetFieldSchema,
  maxDepth = 3,
  name,
  title,
  collectionName,
  noChildren = false,
  // TODO: 等整理完完整测试用例后，再开启该功能
  noDisabled = true,
  dataSource,
  returnFields = (fields) => fields,
  deprecated,
  tooltip,
  operators = [],
}: BaseProps) => {
  const compile = useCompile();
  const getFilterOptions = useGetFilterOptions();
  const { isDisabled } = useContext(BaseVariableContext) || {};
  const cm = useCollectionManager();

  const loadChildren = (option: Option): Promise<void> => {
    if (!option.field?.target) {
      return Promise.resolve(void 0);
    }

    const target = option.field.target;
    return new Promise((resolve) => {
      setTimeout(() => {
        const usedInVariable = true;
        const children = (
          getChildren(returnFields(getFilterOptions(target, dataSource, usedInVariable), option), {
            collectionField,
            uiSchema,
            targetFieldSchema,
            depth: option.depth + 1,
            maxDepth,
            noDisabled,
            loadChildren,
            compile,
            isDisabled: isDisabled || isDisabledDefault,
            getCollectionField: cm.getCollectionField,
            deprecated,
          }) || []
        )
          // 将叶子节点排列在上面，方便用户选择
          .sort((a, b) => {
            if (a.isLeaf && !b.isLeaf) {
              return -1;
            }
            if (!a.isLeaf && b.isLeaf) {
              return 1;
            }
            return 0;
          })
          // 将禁用项排列在下面，方便用户选择
          .sort((a, b) => {
            if (a.disabled && !b.disabled) {
              return 1;
            }
            if (!a.disabled && b.disabled) {
              return -1;
            }
            return 0;
          });

        if (children.length === 0) {
          option.disabled = true;
          option.isLeaf = true;
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
      label: getLabelWithTooltip(title, tooltip),
      value: name,
      key: name,
      isLeaf: noChildren,
      field: {
        target: collectionName,
      },
      depth: 0,
      loadChildren,
      children: [],
      disabled: !!deprecated,
      deprecated,
      operators,
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
  const { option, collectionField, uiSchema, targetFieldSchema, getCollectionField } = params;

  if (!uiSchema || !collectionField) {
    return true;
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

  if (option.target && isSpecialCaseField({ collectionField, fieldSchema: targetFieldSchema, getCollectionField })) {
    return false;
  }

  // 对一字段不允许设置多个值
  if (['hasOne', 'belongsTo'].includes(collectionField.type) && ['hasMany', 'belongsToMany'].includes(option.type)) {
    return true;
  }
  if (['hasOne', 'belongsTo'].includes(collectionField.type) && ['hasOne', 'belongsTo'].includes(option.type)) {
    return false;
  }

  // 对多字段可以选择对一和对多字段作为默认值
  if (['hasMany', 'belongsToMany'].includes(collectionField.type) && option.target) {
    return false;
  }

  if (['input', 'markdown', 'richText', 'textarea', 'username'].includes(collectionField.interface)) {
    return !['string', 'number'].includes(option.schema?.type);
  }

  if (collectionField.interface && option.interface) {
    return collectionField.interface !== option.interface;
  }

  if (uiSchema?.['x-component'] !== option.schema?.['x-component']) {
    return true;
  }

  return false;
}
