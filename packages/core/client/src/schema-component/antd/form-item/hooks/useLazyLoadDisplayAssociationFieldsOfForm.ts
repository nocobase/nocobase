/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { useField, useFieldSchema, useForm } from '@formily/react';
import { toJS, untracked } from '@formily/reactive';
import { nextTick } from '@nocobase/utils/client';
import _ from 'lodash';
import { useEffect, useMemo, useRef } from 'react';
import { useAssociationNames } from '../../../../block-provider/hooks';
import { useCollectionManager_deprecated, useCollection_deprecated } from '../../../../collection-manager';
import { useFlag } from '../../../../flag-provider';
import { useVariables } from '../../../../variables';
import { transformVariableValue } from '../../../../variables/utils/transformVariableValue';
import { useSubFormValue } from '../../association-field/hooks';
import { isDisplayField } from '../utils';

/**
 * 用于懒加载 Form 区块中只用于展示的关联字段的值
 *
 * - 在表单区块中，有一个 Display association fields 的选项，这里面的字段，只是为了显示出相应的值，不可更改
 * - 这里就是加载这些字段值的地方
 */
const useLazyLoadDisplayAssociationFieldsOfForm = () => {
  const { name } = useCollection_deprecated();
  const { getCollectionJoinField, getCollection } = useCollectionManager_deprecated();
  const form = useForm();
  const fieldSchema = useFieldSchema();
  const variables = useVariables();
  const field = useField<Field>();
  const { formValue: subFormValue } = useSubFormValue();
  const { isInSubForm, isInSubTable } = useFlag() || {};
  const { getAssociationAppends } = useAssociationNames();

  const schemaName = fieldSchema.name.toString();

  // 是否已经预加载了数据（通过 appends 的形式）
  // const hasPreloadData = useMemo(() => hasPreload(recordData, schemaName), [recordData, schemaName]);

  const collectionFieldRef = useRef(null);
  const sourceCollectionFieldRef = useRef(null);

  if (collectionFieldRef.current == null && isDisplayField(schemaName)) {
    collectionFieldRef.current = getCollectionJoinField(`${name}.${schemaName}`);
  }
  if (sourceCollectionFieldRef.current == null && isDisplayField(schemaName)) {
    sourceCollectionFieldRef.current = getCollectionJoinField(`${name}.${schemaName.split('.')[0]}`);
  }

  const shouldNotLazyLoad = useMemo(() => {
    return !isDisplayField(schemaName) || !variables || name === 'fields' || !collectionFieldRef.current;
  }, [schemaName, variables, name, collectionFieldRef.current]);

  const formValue = shouldNotLazyLoad
    ? {}
    : untracked(() => _.cloneDeep(isInSubForm || isInSubTable ? subFormValue : form.values));

  const sourceKeyValueRaw =
    isDisplayField(schemaName) && sourceCollectionFieldRef.current
      ? _.get(formValue, `${schemaName.split('.')[0]}.${sourceCollectionFieldRef.current?.targetKey || 'id'}`)
      : undefined;

  const sourceKeyValueRef = useRef(sourceKeyValueRaw);
  if (!_.isEqual(sourceKeyValueRef.current, sourceKeyValueRaw)) {
    sourceKeyValueRef.current = sourceKeyValueRaw;
  }
  const sourceKeyValue = sourceKeyValueRef.current;

  useEffect(() => {
    // 如果 schemaName 中是以 `.` 分割的，说明是一个关联字段，需要去获取关联字段的值；
    // 在数据表管理页面，也存在 `a.b` 之类的 schema name，其 collectionName 为 fields，所以在这里排除一下 `name === 'fields'` 的情况
    if (shouldNotLazyLoad) {
      return;
    }

    if (_.isEmpty(formValue)) {
      return;
    }

    const formVariable = {
      name: '$nForm',
      ctx: formValue,
      collectionName: name,
      dataSource: collectionFieldRef.current.dataSourceKey,
    };
    const variableString = `{{ $nForm.${schemaName} }}`;

    // 如果关系字段的 id 为空，则说明请求的数据还没有返回，此时还不能去解析变量
    if (sourceKeyValue == null) {
      return;
    }

    const { appends } = getAssociationAppends();
    const collection = getCollection(collectionFieldRef.current?.collectionName);
    variables
      .parseVariable(variableString, formVariable, { appends })
      .then(({ value }) => {
        nextTick(() => {
          const result = normalizeDisplayAssociationFieldValue(
            transformVariableValue(value, { targetCollectionField: collectionFieldRef.current }),
          );
          if (result == null) {
            if (field.value != null) {
              field.value = null;
            }
          } else {
            const currentComparableValue = normalizeDisplayAssociationFieldValue(
              transformVariableValue(field.value, { targetCollectionField: collectionFieldRef.current }),
            );
            if (_.isEqual(currentComparableValue, result)) {
              return;
            }
            field.setValue(result);
            field.componentProps = {
              ...field.componentProps,
              readOnlySubmit: true,
              filterTargetKey: collection?.filterTargetKey || 'id',
            }; // 让它不参与提交
          }
        });
      })
      .catch((err) => {
        console.error(err);
      });
  }, [sourceKeyValue, shouldNotLazyLoad]);
};

export default useLazyLoadDisplayAssociationFieldsOfForm;

function normalizeDisplayAssociationFieldValue(value: any) {
  return untracked(() => {
    const plainValue = toJS(value);
    return removeCircularReferences(plainValue);
  });
}

/**
 * Remove circular references from an object while preserving shared references.
 *
 * This function distinguishes between:
 * - Circular references: Objects that reference themselves in the recursion path (removed)
 * - Shared references: Objects that appear multiple times but aren't circular (preserved)
 *
 * @param value - The value to process
 * @param seen - WeakMap cache of processed objects
 * @param path - WeakSet tracking current recursion path
 * @returns The processed value with circular references removed
 *
 * @example
 * // Shared reference (preserved)
 * const shared = { name: "shared" };
 * removeCircularReferences({ a: shared, b: shared });
 * // Returns: { a: { name: "shared" }, b: { name: "shared" } }
 *
 * @example
 * // Circular reference (removed)
 * const circular = { name: "circular" };
 * circular.self = circular;
 * removeCircularReferences(circular);
 * // Returns: { name: "circular" }
 */
export function removeCircularReferences(value: any, seen = new WeakMap<object, any>(), path = new WeakSet<object>()) {
  if (value == null || typeof value !== 'object') {
    return value;
  }

  if (!Array.isArray(value) && (!_.isPlainObject(value) || Object.getPrototypeOf(value) === null)) {
    return value;
  }

  // Check if this object is in the current recursion path (true circular reference)
  if (path.has(value)) {
    return undefined;
  }

  // If we've seen this object before but it's not in the current path,
  // it's a shared reference - return the already-processed (cleaned) version
  if (seen.has(value)) {
    return seen.get(value);
  }

  // Mark as seen with a placeholder and add to current path
  const result = Array.isArray(value) ? [] : {};
  seen.set(value, result);
  path.add(value);

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      result[index] = removeCircularReferences(item, seen, path);
    });
  } else {
    Object.keys(value).forEach((key) => {
      const normalized = removeCircularReferences(value[key], seen, path);
      if (normalized !== undefined) {
        result[key] = normalized;
      }
    });
  }

  // Remove from current path as we exit this recursion level
  path.delete(value);

  return result;
}

/**
 * 数据是否已被预加载
 * @param record
 * @param path
 * @returns
 */
function hasPreload(record: Record<string, any>, path: string) {
  const value = _.get(record, path);
  return value != null && JSON.stringify(value) !== '[{}]' && JSON.stringify(value) !== '{}';
}
