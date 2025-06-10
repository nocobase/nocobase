/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { GeneralField } from '@formily/core';
import { Schema, useField, useFieldSchema } from '@formily/react';
import _, { isString } from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
import React, { createContext, FC, useCallback, useContext, useMemo } from 'react';
import { useParsedFilter } from '../../../block-provider/hooks/useParsedFilter';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../../../collection-manager';
import { Collection } from '../../../data-source';
import { isInFilterFormBlock } from '../../../filter-provider';
import { mergeFilter } from '../../../filter-provider/utils';
import { useRecord } from '../../../record-provider';
import { useMobileLayout } from '../../../route-switch/antd/admin-layout';
import { useDesignable } from '../../hooks';
import { AssociationFieldMode } from './AssociationFieldModeProvider';
import { AssociationFieldContext } from './context';

export const useInsertSchema = (component) => {
  const fieldSchema = useFieldSchema();
  const { insertAfterBegin } = useDesignable();
  const { isMobileLayout } = useMobileLayout();
  const insert = useCallback(
    (ss) => {
      // 移动端的布局更改了本地的 schema 的结构（数据库里的没改），所以不能插入新的 schema，否则可能会导致 schema 的结构出问题
      if (isMobileLayout) {
        return;
      }

      const schema = fieldSchema.reduceProperties((buf, s) => {
        if (s['x-component'] === 'AssociationField.' + component) {
          return s;
        }
        return buf;
      }, null);
      if (!schema) {
        insertAfterBegin(cloneDeep(ss));
      }
    },
    [component, fieldSchema, insertAfterBegin, isMobileLayout],
  );
  return insert;
};

export function useAssociationFieldContext<F extends GeneralField>() {
  return useContext(AssociationFieldContext) as {
    options: any;
    field: F;
    fieldSchema?: Schema;
    currentMode: AssociationFieldMode;
    allowMultiple?: boolean;
    allowDissociate?: boolean;
  };
}

// 用于获取关系字段请求数据时所需的一些参数
export default function useServiceOptions(props) {
  const { action = 'list', service, useOriginalFilter } = props;
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { getField } = useCollection_deprecated();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const record = useRecord();
  const filterParams =
    (isString(fieldSchema?.['x-component-props']?.service?.params?.filter)
      ? field.componentProps?.service?.params?.filter
      : fieldSchema?.['x-component-props']?.service?.params?.filter) || service?.params?.filter;

  const { filter: parsedFilterParams } = useParsedFilter({ filterOption: filterParams });

  const collectionField = useMemo(() => {
    return getField(fieldSchema.name) || getCollectionJoinField(fieldSchema?.['x-collection-field']);
  }, [fieldSchema]);

  const sourceValue = record?.[collectionField?.sourceKey];
  const filter = useMemo(() => {
    const isOToAny = ['oho', 'o2m'].includes(collectionField?.interface);
    return mergeFilter(
      [
        mergeFilter([
          isOToAny && !isInFilterFormBlock(fieldSchema) && collectionField?.foreignKey && !useOriginalFilter
            ? {
                [collectionField.foreignKey]: {
                  $is: null,
                },
              }
            : null,
          parsedFilterParams,
        ]),
        isOToAny &&
        sourceValue !== undefined &&
        sourceValue !== null &&
        !isInFilterFormBlock(fieldSchema) &&
        collectionField?.foreignKey &&
        !useOriginalFilter
          ? {
              [collectionField.foreignKey]: {
                $eq: sourceValue,
              },
            }
          : null,
        // params?.filter && value?.length
        //   ? {
        //       [fieldNames?.value]: {
        //         ['$in']: value,
        //       },
        //     }
        //   : null,
      ],
      '$or',
    );
  }, [
    collectionField?.interface,
    collectionField?.foreignKey,
    fieldSchema,
    parsedFilterParams,
    sourceValue,
    useOriginalFilter,
  ]);

  return useMemo(() => {
    return {
      resource: collectionField?.target,
      action,
      ...service,
      params: { ...service?.params, filter },
    };
  }, [collectionField?.target, action, filter, service]);
}

export const useFieldNames = (
  props: {
    fieldNames?: {
      label: string;
      value: string;
    };
  } = {},
) => {
  const fieldSchema = useFieldSchema();
  const fieldNames =
    fieldSchema['x-component-props']?.['field']?.['uiSchema']?.['x-component-props']?.['fieldNames'] ||
    fieldSchema['x-component-props']?.['fieldNames'] ||
    props.fieldNames;
  return { label: 'label', value: 'value', ...fieldNames };
};

interface SubFormProviderProps {
  value: any;
  collection: Collection;
  /**
   * the schema of the current sub-table or sub-form
   */
  fieldSchema?: Schema;
  parent?: SubFormProviderProps;
  /**
   * Ignore the current value in the upper and lower levels
   */
  skip?: boolean;
}

const SubFormContext = createContext<SubFormProviderProps>(null);
SubFormContext.displayName = 'SubFormContext';

export const SubFormProvider: FC<{ value: SubFormProviderProps }> = (props) => {
  const _parent = useContext(SubFormContext);
  const { value, collection, fieldSchema, parent, skip } = props.value;
  const memoValue = useMemo(
    () =>
      _.omitBy(
        { value, collection, fieldSchema, skip, parent: parent || (_parent?.skip ? _parent.parent : _parent) },
        _.isUndefined,
      ),
    [value, collection, fieldSchema, skip, parent, _parent],
  ) as SubFormProviderProps;
  return <SubFormContext.Provider value={memoValue}>{props.children}</SubFormContext.Provider>;
};

/**
 * 用于获取子表单所对应的 form 对象，其应该保持响应性，即一个 Proxy 对象；
 *
 * ## 为什么要有这个方法？
 * 1. 目前使用 useForm 方法获取到的是普通表单区块的 form 对象，无法通过简单的方法获取到子表单对应的 form 对象；
 * 2. 虽然现在 useRecord  也可以获取到相同值的对象，但是这个对象不是响应式的（因其内部 copy 过一次），字段值变更时无法监听到；
 * 3. 可能更好的方式是在 useForm 返回的 form 对象添加一个 parent 属性，但可能会影响其它部分的代码，所以暂时不做修改；
 * @returns
 */
export const useSubFormValue = () => {
  const { value, collection, fieldSchema, parent } = useContext(SubFormContext) || {};
  return {
    formValue: value,
    collection,
    fieldSchema,
    parent,
  };
};
